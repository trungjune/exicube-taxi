/*eslint no-loop-func: "off"*/
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const valProj = require('regularusedfunctions').valProj;
const validateBasicAuth = require('regularusedfunctions').validateBasicAuth;
const RequestPushMsg = require('./common').RequestPushMsg;
const addToWallet = require('./common').addToWallet;
const deductFromWallet = require('./common').deductFromWallet;
const getDistance = require('./common').getDistance;
const config = require('./config.json');
const addEstimate = require('./common/sharedFunctions').addEstimate;
const translate = require('@iamtraction/google-translate');

exports.googleapis = require('./google-apis');

admin.initializeApp();

// var transporter = nodemailer.createTransport(config.smtpDetails);

var arr = [];

const methods = Object.keys(config.paymentMethods);
for (let i = 0; i < methods.length; i++) {
    if(config.paymentMethods[methods[i]].active){
        exports[methods[i]] = require(`./providers/${methods[i]}`);
        arr.push({
            name: methods[i],
            link: '/' + methods[i] + '-link'
        });
    }
}

exports.get_providers = functions.https.onRequest(async(request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    const flag = await valProj(config.firebaseProjectId);
    if(flag.success){
        response.send(arr);
    }else{
        response.send([]);
    }
});

exports.success = functions.https.onRequest(async (request, response) => {
    const language = Object.values((await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value')).val())[0].keyValuePairs;
    var amount_line = request.query.amount ? `<h3>${language.payment_of}<strong>${request.query.amount}</strong>${language.was_successful}</h3>` : '';
    var order_line = request.query.order_id ? `<h5>${language.order_no}${request.query.order_id}</h5>` : '';
    var transaction_line = request.query.transaction_id ? `<h6>${language.transaction_id}${request.query.transaction_id}</h6>` : '';
    response.status(200).send(`
        <!DOCTYPE HTML>
        <html>
        <head> 
            <meta name='viewport' content='width=device-width, initial-scale=1.0'> 
            <title>${language.success_payment}</title> 
            <style> 
                body { font-family: Verdana, Geneva, Tahoma, sans-serif; } 
                h3, h6, h4 { margin: 0px; } 
                .container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 60px 0; } 
                .contentDiv { padding: 40px; box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.3); border-radius: 10px; width: 70%; margin: 0px auto; text-align: center; } 
                .contentDiv img { width: 140px; display: block; margin: 0px auto; margin-bottom: 10px; } 
                .contentDiv h3 { font-size: 22px; } 
                .contentDiv h6 { font-size: 13px; margin: 5px 0; } 
                .contentDiv h4 { font-size: 16px; } 
            </style>
        </head>
        <body> 
            <div class='container'>
                <div class='contentDiv'> 
                    <img src='https://cdn.pixabay.com/photo/2012/05/07/02/13/accept-47587_960_720.png' alt='Icon'> 
                    ${amount_line}
                    ${order_line}
                    ${transaction_line}
                    <h4>${language.payment_thanks}</h4>
                </div>
            </div>
            <script type="text/JavaScript">setTimeout("location.href = '${request.query.order_id && request.query.order_id.startsWith('wallet')?"/userwallet":"/bookings"}';",5000);</script>
        </body>
        </html>
    `);
});

exports.cancel = functions.https.onRequest(async(request, response) => {
    const language = Object.values((await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value')).val())[0].keyValuePairs;
    response.send(`
        <!DOCTYPE HTML>
        <html>
        <head> 
            <meta name='viewport' content='width=device-width, initial-scale=1.0'> 
            <title>${language.payment_cancelled}</title> 
            <style> 
                body { font-family: Verdana, Geneva, Tahoma, sans-serif; } 
                .container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 60px 0; } 
                .contentDiv { padding: 40px; box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.3); border-radius: 10px; width: 70%; margin: 0px auto; text-align: center; } 
                .contentDiv img { width: 140px; display: block; margin: 0px auto; margin-bottom: 10px; } 
                h3, h6, h4 { margin: 0px; } .contentDiv h3 { font-size: 22px; } 
                .contentDiv h6 { font-size: 13px; margin: 5px 0; } 
                .contentDiv h4 { font-size: 16px; } 
            </style>
        </head>
        <body> 
            <div class='container'> 
                <div class='contentDiv'> 
                    <img src='https://cdn.pixabay.com/photo/2012/05/07/02/13/cancel-47588_960_720.png' alt='Icon'> 
                    <h3>${language.payment_fail}</h3> 
                    <h4>${language.try_again}</h4>
                </div> 
            </div>
            <script type="text/JavaScript">setTimeout("location.href = '/bookings';",5000);</script>
        </body>
        </html>
    `);
});

exports.updateBooking = functions.database.ref('/bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        let oldrow = change.before.val();
        let booking = change.after.val();
        booking.key = context.params.bookingId;
        if (!booking.bookLater && oldrow.status === 'PAYMENT_PENDING' && booking.status === 'NEW') {
            admin.database().ref('/users').orderByChild("queue").equalTo(false).once("value", (ddata) => {
                let drivers = ddata.val();
                if (drivers) {
                    admin.database().ref("settings").once("value", async settingsdata => {
                        let settings = settingsdata.val();
                        const langSnap = await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value');
                        const language = Object.values(langSnap.val())[0].keyValuePairs;
                        for (let dkey in drivers) {
                            let driver = drivers[dkey];
                            driver.key = dkey;
                            admin.database().ref("locations/" + dkey).once("value", driverlocdata => {
                                let location = driverlocdata.val();
                                if (driver.usertype === 'driver' && driver.approved === true && driver.driverActiveStatus === true && location && ((driver.carApproved ===true && settings.carType_required) || !settings.carType_required) && ((driver.term === true && settings.term_required) || !settings.term_required) && ((driver.licenseImage && settings.license_image_required) || !settings.license_image_required )) {
                                        let originalDistance = getDistance(booking.pickup.lat, booking.pickup.lng, location.lat, location.lng);
                                        if (settings.convert_to_mile) {
                                            originalDistance = originalDistance / 1.609344;
                                        }
                                        if (originalDistance <= settings.driverRadius && ((driver.carType === booking.carType  && settings.carType_required) || !settings.carType_required) && settings.autoDispatch) {
                                            admin.database().ref('bookings/' + booking.key + '/requestedDrivers/' + driver.key).set(true);
                                            if(driver.pushToken){
                                                RequestPushMsg(
                                                    driver.pushToken,
                                                    {
                                                        title: language.notification_title,
                                                        msg: language.new_booking_notification,
                                                        screen: 'DriverTrips',
                                                        channelId: settings.CarHornRepeat? 'bookings-repeat': 'bookings',
                                                        ios:  driver.userPlatform === "IOS"? true: false
                                                    }
                                                );
                                            }
                                        }
                        
                                } else{
                                    return false;
                                }
                                return true;
                            });
                        }
                    })
                } else {
                    return false;
                }
                return true;
            });
        }
        if (oldrow.status !== booking.status && booking.status === 'CANCELLED') {
            if (booking.customer_paid && parseFloat(booking.customer_paid) > 0 && booking.payment_mode!=='cash') {
                addToWallet(booking.customer, parseFloat(booking.customer_paid), "Admin Credit", null);
            }
            if (oldrow.status === 'ACCEPTED' && booking.cancelledBy === 'customer') {
                admin.database().ref("tracking/" + booking.key).orderByChild("status").equalTo("ACCEPTED").once("value", (sdata) => {
                    let items = sdata.val();
                    if (items) {
                        let accTime;
                        for (let skey in items) {
                            accTime = new Date(items[skey].at);
                            break;
                        }
                        let date1 = new Date();
                        let date2 = new Date(accTime);
                        let diffTime = date1 - date2;
                        let diffMins = diffTime / (1000 * 60);
                        admin.database().ref("cartypes").once("value", async (cardata) => {
                            const cars = cardata.val();
                            let cancelSlab = null;
                            for (let ckey in cars) {
                                if (booking.carType === cars[ckey].name) {
                                    cancelSlab = cars[ckey].cancelSlab;
                                }
                            }
                            let deductValue = 0;
                            if (cancelSlab) {
                                for (let i = 0; i < cancelSlab.length; i++) {
                                    if (diffMins > parseFloat(cancelSlab[i].minsDelayed)) {
                                        deductValue = cancelSlab[i].amount;
                                    }
                                }
                            }
                            if (deductValue > 0) {
                                await admin.database().ref("bookings/" + booking.key + "/cancellationFee").set(deductValue);
                                deductFromWallet(booking.customer, deductValue, 'Cancellation Fee');
                                addToWallet(booking.driver, deductValue, "Cancellation Fee", null);
                            }
                        })
                        
                    }
                })
            }
        }
        if (booking.status === 'COMPLETE') {
            const language = Object.values((await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value')).val())[0].keyValuePairs;
            let detailsData = await admin.database().ref("smtpdata").once("value");
            let details = detailsData.val();
            if(details){
                try{
                    var transporter = nodemailer.createTransport(details.smtpDetails);
                    var date = new Date(booking.tripdate).getDate();
                    var year = new Date(booking.tripdate).getFullYear();
                    var month = new Date(booking.tripdate).getMonth()+1;
                    let html = `
                        <!DOCTYPE html>
                        <html>
                        <head><style>table, th, td { border: 1px solid black;}</style></head>
                        <body>
                        <div class="w3-container">
                            <h4>Hi ${language.ride_details_page_title}</h4>
                            <table class="w3-table-all w3-centered" style="width:60%",>
                            <tr>
                                <th>${language.booking_ref}</th>
                                <th>${language.booking_date}</th>
                                <th>${language.driver_name}</th>
                                <th>${language.vehicle_no}</th>
                                <th>${language.pickup_address}</th>
                                <th>${language.drop_address}</th>
                                <th>${language.Customer_paid}</th>
                            </tr>
                            <tr>
                                <td>${booking.reference}</td>  
                                <td>${date}.${month}.${year}</td>  
                                <td>${booking.driver_name}</td>
                                <td>${booking.vehicle_number}</td>
                                <td>${booking.pickupAddress}</td>
                                <td>${booking.dropAddress}</td>
                                <td>${booking.customer_paid}</td>
                            </tr>
                            </table>
                        </div>
                        </body>
                        </html>`;
                    transporter.sendMail({
                        from: details.fromEmail,
                        to: booking.customer_email,
                        subject: language.ride_details_page_title,
                        html: html,
                    }).then(res => console.log('successfully sent that mail')).catch(err => console.log(err));
                }catch(error){
                    console.log(error.toString());
                }
            }
        }
        if(booking.payment_mode ==='wallet' && 
            (
                (oldrow.status === 'PAYMENT_PENDING' && booking.status === 'NEW' && booking.prepaid) ||
                (oldrow.status === 'PENDING' && booking.status === 'PAID' && !booking.prepaid) ||
                (oldrow.status === 'REACHED' && booking.status === 'COMPLETE' && !booking.prepaid) ||
                (oldrow.status === 'NEW' && booking.status === 'ACCEPTED' && booking.prepaid &&  !(booking.customer_paid &&  parseFloat(booking.customer_paid)>=0)) ||
                (oldrow.status === 'NEW' && booking.status === 'ACCEPTED' && oldrow.selectedBid && !booking.selectedBid && booking.prepaid)
            )
        ) {
            const snapshot = await admin.database().ref("users/" + booking.customer).once('value');
            let profile = snapshot.val();
            const settingdata = await admin.database().ref('settings').once("value");
            let settings = settingdata.val();
            let walletBal = parseFloat(profile.walletBalance) - parseFloat(parseFloat(booking.trip_cost) - parseFloat(booking.discount));
            let tDate = new Date();
            let details = {
                type: 'Debit',
                amount: parseFloat(parseFloat(booking.trip_cost) - parseFloat(booking.discount)),
                date: tDate.getTime(),
                txRef: booking.id
            }
            await admin.database().ref("users/" + booking.customer).update({walletBalance: parseFloat(parseFloat(walletBal).toFixed(settings.decimal))})
            await admin.database().ref("walletHistory/" + booking.customer).push(details);
            const langSnap = await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value');
            const language = Object.values(langSnap.val())[0].keyValuePairs;
            if(profile.pushToken){
                RequestPushMsg(
                    profile.pushToken,
                    {
                        title: language.notification_title,
                        msg: language.wallet_updated,
                        screen: 'Wallet',
                        ios:  profile.userPlatform === "IOS"? true: false
                    }
                );
            }
        }
        if((oldrow.status === 'REACHED' && booking.status === 'PAID') || 
           (oldrow.status === 'PENDING' && booking.status === 'PAID') ||
           (oldrow.status === 'PENDING' && booking.status === 'COMPLETE') ||
           (oldrow.status === 'REACHED' && booking.status === 'COMPLETE')
        ){
            const snapshotDriver = await admin.database().ref("users/" + booking.driver).once('value');
            let profileDriver = snapshotDriver.val();
            const settingdata = await admin.database().ref('settings').once("value");
            let settings = settingdata.val();
            let driverWalletBal = parseFloat(profileDriver.walletBalance);
            if(booking.payment_mode ==='cash' && booking.cashPaymentAmount && parseFloat(booking.cashPaymentAmount)> 0){
                let details = {
                    type: 'Debit',
                    amount: booking.cashPaymentAmount,
                    date: new Date().getTime(),
                    txRef: booking.id
                }
                await admin.database().ref("walletHistory/" + booking.driver).push(details);
                driverWalletBal = driverWalletBal - parseFloat(booking.cashPaymentAmount);
            }
            driverWalletBal = driverWalletBal + parseFloat(booking.driver_share);
            let driverDetails = {
                type: 'Credit',
                amount: booking.driver_share,
                date: new Date().getTime(),
                txRef: booking.id
            }
            await admin.database().ref("users/" + booking.driver).update({walletBalance: parseFloat(parseFloat(driverWalletBal).toFixed(settings.decimal))})
            await admin.database().ref("walletHistory/" + booking.driver).push(driverDetails);
            const langSnap = await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value');
            const language = Object.values(langSnap.val())[0].keyValuePairs;
            if(profileDriver.pushToken){
                RequestPushMsg(
                    profileDriver.pushToken,
                    {
                        title: language.notification_title,
                        msg: language.wallet_updated,
                        screen: 'Wallet',
                        ios:  profileDriver.userPlatform === "IOS"? true: false
                    }
                );
            }
        }
    });

    exports.getaddress = functions.https.onRequest(async (request, response) => {
        response.set("Access-Control-Allow-Origin", "*");
        response.set("Access-Control-Allow-Headers", "Content-Type");
        const user = await validateBasicAuth(request.headers.authorization, config);
        if(user){
            let url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${request.body.latlng}&key=${GOOGLE_MAP_SERVER_KEY}`;
            if(request.body.maplang && request.body.maplang.length>1){
                url = url + `&language=${request.body.maplang}`;
            }
            let res = await fetch(url);
            let json = await res.json();
            if (json.results && json.results.length > 0 && json.results[0].formatted_address) {
                response.send({
                    address:json.results[0].formatted_address
                });
            }else{
                response.send({ error: 'Geocode API : Coordinates to Address Error' });
            }
        }else{
            response.send({ error: 'Unauthorized api call' });
        }
    });

exports.withdrawCreate = functions.database.ref('/withdraws/{wid}')
    .onCreate(async(snapshot, context) => {
        let wid = context.params.wid;
        let withdrawInfo = snapshot.val();
        let uid = withdrawInfo.uid;
        let amount = withdrawInfo.amount;

        const userData = await admin.database().ref("users/" + uid).once('value');
        let profile = userData.val();
        const settingdata = await admin.database().ref('settings').once("value");
        let settings = settingdata.val();
        let walletBal = parseFloat(profile.walletBalance) - parseFloat(amount);

        let tDate = new Date();
        let details = {
          type: 'Withdraw',
          amount: amount,
          date: tDate.getTime(),
          txRef: tDate.getTime().toString(),
          transaction_id: wid
        }
        await admin.database().ref("users/" + uid).update({walletBalance: parseFloat(parseFloat(walletBal).toFixed(settings.decimal))})
        await admin.database().ref("walletHistory/" + uid).push(details);
        const langSnap = await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value');
        const language = Object.values(langSnap.val())[0].keyValuePairs;
        if(profile.pushToken){
            RequestPushMsg(
                profile.pushToken,
                {
                    title: language.notification_title,
                    msg: language.wallet_updated,
                    screen: 'Wallet',
                    ios:  profile.userPlatform === "IOS"? true: false
                }
            );
        }

    });

exports.bookingScheduler = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
    admin.database().ref('/bookings').orderByChild("status").equalTo('NEW').once("value", (snapshot) => {
        let bookings = snapshot.val();
        if (bookings) {
            for (let key in bookings) {
                let booking = bookings[key];
                booking.key = key;
                let date1 = new Date();
                let date2 = new Date(booking.tripdate);
                let diffTime = date2 - date1;
                let diffMins = diffTime / (1000 * 60);
                if ((diffMins > 0 && diffMins < 15 && booking.bookLater && !booking.requestedDrivers) || diffMins < -5) {
                    admin.database().ref('/users').orderByChild("queue").equalTo(false).once("value", (ddata) => {
                        let drivers = ddata.val();
                        if (drivers) {
                            admin.database().ref("settings").once("value", async settingsdata => {
                                let settings = settingsdata.val();
                                const langSnap = await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value');
                                const language = Object.values(langSnap.val())[0].keyValuePairs;
                                for (let dkey in drivers) {
                                    let driver = drivers[dkey];
                                    driver.key = dkey;
                                    if(!(booking.requestedDrivers && booking.requestedDrivers[dkey])){
                                        admin.database().ref("locations/" + dkey).once("value", driverlocdata => {
                                            let location = driverlocdata.val();
                                            if (driver.usertype === 'driver' && driver.approved === true && driver.driverActiveStatus === true && location && ((driver.carApproved ===true && settings.carType_required) || !settings.carType_required) && ((driver.term === true && settings.term_required) || !settings.term_required) && ((driver.licenseImage && settings.license_image_required) || !settings.license_image_required )) {
                                                let originalDistance = getDistance(booking.pickup.lat, booking.pickup.lng, location.lat, location.lng);
                                                if(settings.convert_to_mile){
                                                    originalDistance = originalDistance / 1.609344;
                                                }
                                                if (originalDistance <= settings.driverRadius && ((driver.carType === booking.carType  && settings.carType_required) || !settings.carType_required) && settings.autoDispatch) {
                                                    admin.database().ref('bookings/' + booking.key + '/requestedDrivers/' + driver.key).set(true);
                                                    addEstimate(booking.key, driver.key, originalDistance);
                                                    if(driver.pushToken){
                                                        RequestPushMsg(
                                                            driver.pushToken, 
                                                            {
                                                                title: language.notification_title, 
                                                                msg: language.new_booking_notification,
                                                                screen: 'DriverTrips',
                                                                channelId: settings.CarHornRepeat? 'bookings-repeat': 'bookings',
                                                                ios: driver.userPlatform === "IOS"? true: false
                                                            }
                                                        );
                                                    }
                                                    return true;
                                                }
                                                return true;
                                            }else{
                                                return false;
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            return false;
                        }
                        return true;
                    });
                }
                if (diffMins < -30) {
                    admin.database().ref("bookings/" + booking.key + "/requestedDrivers").remove();
                    admin.database().ref('bookings/' + booking.key).update({
                        status: 'CANCELLED',
                        reason: 'RIDE AUTO CANCELLED. NO RESPONSE',
                        cancelledBy: 'admin'
                    });
                    return true;
                }
            }
        }
        else {
            return false;
        }
        return true;
    });
});


exports.userDelete = functions.database.ref('/users/{uid}')
    .onDelete((snapshot, context) => {
        let uid = context.params.uid;
        return admin.auth().deleteUser(uid);
    });

exports.userCreate = functions.database.ref('/users/{uid}')
    .onCreate((snapshot, context) => {
        let uid = context.params.uid;
        let userInfo = snapshot.val();
        let userCred = { uid: uid};
        if(userInfo.mobile){
            userCred['phoneNumber'] = userInfo.mobile;
        }
        if(userInfo.email){
            userCred['email'] = userInfo.email;
        }
        admin.auth().getUser(uid)
            .then((userRecord) => {
                return true;
            })
            .catch((error) => {
                if(uid === 'admin0001') userCred['password'] = 'Admin@123';
                admin.auth().createUser(userCred)
            });
    });

exports.send_notification = functions.https.onRequest( async(request, response) => {
    let settingdata = await admin.database().ref('settings').once("value");
    let settings = settingdata.val();
    const allowedOrigins = ['https://' + config.firebaseProjectId + '.web.app', settings.CompanyWebsite];
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
        response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Headers", "Content-Type");
    if (request.body.token === 'token_error' || request.body.token === 'web') {
        response.send({ error: 'Token found as ' + request.body.token });
    } else {
        let data = {
            title: request.body.title, 
            msg: request.body.msg,
        };
        if(request.body.screen){
            data['screen'] = request.body.screen;
        }
        if(request.body.params){
            data['params'] = request.body.params;
        }
        if(request.body.channelId){
            data['channelId'] = request.body.channelId;
        }
        if(request.body.ios){
            data['ios'] = request.body.ios;
        }
        RequestPushMsg(
            request.body.token, 
            data
        ).then((responseData) => {
            response.send(responseData);
            return true;
        }).catch(error => {
            response.send({ error: error });
        });
    }
});

exports.check_user_exists = functions.https.onRequest( async(request, response) => {
    let settingdata = await admin.database().ref('settings').once("value");
    let settings = settingdata.val();
    const allowedOrigins = ['https://' + config.firebaseProjectId + '.web.app', settings.CompanyWebsite];
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
        response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Headers", "Content-Type");
    let arr = [];
    const user = await validateBasicAuth(request.headers.authorization, config);
    if(user){
        if (request.body.email || request.body.mobile) {
            if (request.body.email) {
                arr.push({ email: request.body.email });
            }
            if (request.body.mobile) {
                arr.push({ phoneNumber: request.body.mobile });
            }
            try{
                admin
                .auth()
                .getUsers(arr)
                .then((getUsersResult) => {
                    response.send({ users: getUsersResult.users });
                    return true;
                })
                .catch((error) => {
                    response.send({ error: error });
                });
            }catch(error){
                response.send({ error: error });
            }
        } else {
            response.send({ error: "Email or Mobile not found." });
        }
    }else{
        response.send({ error: 'Unauthorized api call' });
    }
});


exports.validate_referrer = functions.https.onRequest(async (request, response) => {
    let referralId = request.body.referralId;
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    const snapshot = await admin.database().ref("users").once('value');
    let value = snapshot.val();
    if(value){
        let arr = Object.keys(value);
        let key;
        for(let i=0; i < arr.length; i++){
            if(value[arr[i]].referralId === referralId){
                key = arr[i];
            }
        }
        response.send({uid: key}); 
    }else{
        response.send({uid: null});
    }
});

exports.user_signup = functions.https.onRequest(async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    let userDetails = request.body.regData;
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const reference = [...Array(5)].map(_ => c[~~(Math.random()*c.length)]).join('');
    try {
        const flag = await valProj(config.firebaseProjectId);
        if(flag.success){
            let regData = {
                createdAt: new Date().getTime(),
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                mobile: userDetails.mobile,
                email: userDetails.email,
                usertype: userDetails.usertype,
                referralId: reference,
                approved: true,
                walletBalance: 0,
                pushToken: 'init',
                signupViaReferral: userDetails.signupViaReferral? userDetails.signupViaReferral: " "
            };
            let settingdata = await admin.database().ref('settings').once("value");
            let settings = settingdata.val();
            let userRecord = await admin.auth().createUser({
                email: userDetails.email,
                phoneNumber: userDetails.mobile,
                password: userDetails.password,
                emailVerified: true
            });
            if (userDetails.usertype === 'driver') {
                regData.queue = false;
                regData.driverActiveStatus = false;
                if (settings.driver_approval) {
                    regData.approved = false;
                }
            } 
            if(userRecord && userRecord.uid){
                await admin.database().ref('users/' + userRecord.uid).set(regData);
                if(userDetails.signupViaReferral && settings.bonus > 0){
                    await addToWallet(userDetails.signupViaReferral, settings.bonus,"Admin Credit", null);
                    await addToWallet(userRecord.uid, settings.bonus,"Admin Credit", null);
                }
                response.send({ uid: userRecord.uid });
            }else{
                response.send({ error: "User Not Created" });
            }
        }else{
            response.send({ error: "Setup Error" });
        }
    }catch(error){
        response.send({ error: "User Not Created" });
    }
});

exports.update_user_email = functions.https.onRequest(async (request, response) => {
    let settingdata = await admin.database().ref('settings').once("value");
    let settings = settingdata.val();
    const allowedOrigins = ['https://' + config.firebaseProjectId + '.web.app', settings.CompanyWebsite];
    const origin = request.headers.origin;
    if (allowedOrigins.includes(origin)) {
        response.set("Access-Control-Allow-Origin", origin);
    }
    response.set("Access-Control-Allow-Headers", "Content-Type");
    const user = await validateBasicAuth(request.headers.authorization, config);
    if(user){
        const uid = request.body.uid;
        const email = request.body.email;
        if(email){
            admin.auth().updateUser(uid, {
                email: email,
                emailVerified: true
            })
            .then((userRecord) => {
                let updateData = {uid: uid, email: email };
                if(request.body.firstName){
                    updateData['firstName'] = request.body.firstName;
                }
                if(request.body.lastName){
                    updateData['lastName'] = request.body.lastName;
                }
                admin.database().ref("users/" + uid).update(updateData);
                response.send({ success: true, user: userRecord });
                return true;
            })
            .catch((error) => {
                response.send({ error: "Error updating user" });
            });
        }else{ 
            response.send({ error: "Request email not found" });
        }
    }else{
        response.send({ error: 'Unauthorized api call' });
    }
});

exports.gettranslation = functions.https.onRequest((request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    translate(request.query.str, { from: request.query.from, to: request.query.to  })
        .then(res => {
            response.send({text:res.text})
            return true;
        }).catch(err => {
            response.send({error:err.toString()})
            return false;
        });
}); 

exports.getservertime = functions.https.onRequest((request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.send({time: new Date().getTime()})
}); 

exports.checksmtpdetails = functions.https.onRequest(async(request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    try {
        const smtpDetails = request.body.smtpDetails;
        const fromEmail = request.body.fromEmail;

        var transporter = nodemailer.createTransport(request.body.smtpDetails);

        const mailOptions = {
            from: fromEmail,
            to: fromEmail, 
            subject: "Test Mail", 
            text: "Hi, this is a test email.", 
            html: `
            <!DOCTYPE html>
            <html>
            <head><style>table, th, td { border: 1px solid black;}</style></head>
            <body>
            <div class="w3-container">
                <h4>Hi, this is a test email.</h4>
            </div>
            </body>
            </html>`, 
        };

        transporter.sendMail(mailOptions)
            .then((res) => {
                admin.database().ref("smtpdata").set({
                    fromEmail:fromEmail,
                    smtpDetails: smtpDetails
                })
                response.send({ success: true})
                return true;
            })
            .catch((error) => {
                response.send({ error: error.toString()})
            });
    } catch(error){
        response.send({ error: error.toString() })
    }
}); 