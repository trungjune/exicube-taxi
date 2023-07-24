import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, Dimensions, FlatList, Modal, TouchableHighlight, Switch, Image, Platform, Linking, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import MapView, { Polyline, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { colors } from '../common/theme';
import i18n from 'i18n-js';
import { useDispatch, useSelector } from 'react-redux';
import { api } from 'common';
import { Alert } from 'react-native';
import moment from 'moment/min/moment-with-locales';
import carImageIcon from '../../assets/images/track_Car.png';
var { width, height } = Dimensions.get('window');
import { CommonActions } from '@react-navigation/native';
import { ExtraInfo, RateView, appConsts } from '../common/sharedFunctions';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';

export default function DriverTrips(props) {
    const {
        acceptTask,
        cancelTask,
        updateProfile,
        updateBooking,
        fetchTasks,
        RequestPushMsg
    } = api;
    const dispatch = useDispatch();
    const tasks = useSelector(state => state.taskdata.tasks);
    const settings = useSelector(state => state.settingsdata.settings);
    const auth = useSelector(state => state.auth);
    const bookinglistdata = useSelector(state => state.bookinglistdata);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeBookings, setActiveBookings] = useState([]);
    const [region, setRegion] = useState(null);
    const gps = useSelector(state => state.gpsdata);
    const latitudeDelta = 0.0922;
    const longitudeDelta = 0.0421;
    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const [amount,setAmount] = useState({});
    const pageActive = useRef();
    const [deviceId,setDeviceId] = useState();

    useEffect(() => {
        AsyncStorage.getItem('deviceId', (err, result) => {
          if (result) {
            setDeviceId(result);
          } 
        });
    }, []);
  

    const [checks, setChecks] = useState({
        carExists: true,
        carApproved: true,
        licenseAvailable: true,
        approved: true,
        driverActiveStatus: true,
        verifyId: true,
        imageIdApproval: true,
        term: true

    });
   
    useEffect(() => {
        if (auth.profile) {
            setChecks({
                ...checks,
                carExists: auth.profile.carType ? true : false,
                carApproved: auth.profile.carApproved ? true : false,
                licenseAvailable: auth.profile.licenseImage ? true : false,
                approved: auth.profile.approved ? true : false,
                driverActiveStatus: auth.profile.driverActiveStatus ? true : false,
                verifyId: auth.profile.verifyId ? true : false,
                imageIdApproval: auth.profile.verifyIdImage ? true : false,
                term: auth.profile.term ? true : false
            })
        }
    }, [auth.profile])

    useEffect(() => {
        if (bookinglistdata.bookings) {
            setActiveBookings(
                bookinglistdata.bookings.filter(booking =>
                    booking.status == 'ACCEPTED' ||
                    booking.status == 'ARRIVED' ||
                    booking.status == 'STARTED' ||
                    booking.status == 'REACHED'
                )
            )
        }
    }, [bookinglistdata.bookings])

    const onPressAccept = (item, price) => {
        let wallet_balance = parseFloat(auth.profile.walletBalance);
        if((settings && settings.imageIdApproval && auth.profile.verifyId && auth.profile.verifyIdImage) || (settings && !settings.imageIdApproval)){
            if(!settings.negativeBalance && !settings.disable_cash && (wallet_balance <= 0 || (wallet_balance > 0 && wallet_balance < item.convenience_fees)) && item.payment_mode === 'cash'){
                Alert.alert(
                    t('alert'),
                    t('wallet_balance_low')
                );
            } else if(appConsts.acceptWithAmount) {
                if(parseFloat(price) > 0){
                    const  profile =  auth.profile;
                    let convenience_fees = item.commission_type == 'flat'? parseFloat(item.commission_rate) :  (parseFloat(price) * parseFloat(item.commission_rate)/100);
                    let obj = {};
                    obj.driver = auth.profile.uid;
                    obj.driver_image = profile.profile_image ? profile.profile_image : "";
                    obj.car_image = profile.car_image ? profile.car_image : "";
                    obj.driver_name = profile.firstName + ' ' + profile.lastName;
                    obj.driver_contact = profile.mobile;
                    obj.driver_token = profile.pushToken? profile.pushToken : '';
                    obj.vehicle_number = profile.vehicleNumber ? profile.vehicleNumber : "";
                    obj.driverRating = profile.rating ? profile.rating : "0";
                    obj.fleetadmin = profile.fleetadmin ? profile.fleetadmin : '';
                    obj.bidPrice = price;
                    obj.trip_cost = parseFloat(price).toFixed(2);
                    obj.convenience_fees = convenience_fees.toFixed(2);
                    obj.driver_share = parseFloat(parseFloat(price) - parseFloat(convenience_fees)).toFixed(2);
                    obj.car_image =  profile.car_image ? profile.car_image : "";
                    if(!item.driverOffers){
                        item.driverOffers = {};
                    }
                    item.driverOffers[auth.profile.uid] = obj;
                    let allAmts = {...amount};
                    allAmts[item.id] = 0;
                    setAmount(allAmts);
                    dispatch(updateBooking(item));
                    if(item.customer_token){
                        RequestPushMsg(
                            item.customer_token, 
                            { 
                            title: t('notification_title'), 
                            msg: t('start_accept_bid'),
                            screen: 'BookedCab',
                            params: {bookingId: item.id}
                            }
                        )
                    }
                } else {
                    Alert.alert(t('alert'), t('no_details_error'));
                }
            } else {
                item['driverDeviceId'] = deviceId;
                dispatch(acceptTask(item));
                setSelectedItem(null);
                setModalVisible(null);
                setTimeout(() => {
                    props.navigation.dispatch(CommonActions.reset({index: 0,routes: [{ name: 'BookedCab', params: { bookingId: item.id }}]}));
                }, 3000)
            }
        } else {
            Alert.alert(t('alert'), t('verifyid_error'));
        }
    };

    const onPressIgnore = (id) => {
        dispatch(cancelTask(id));
        setSelectedItem(null);
        setModalVisible(null)
    };

    const goToBooking = (id) => {
        props.navigation.dispatch(CommonActions.reset({index: 0,routes: [{ name: 'BookedCab', params: { bookingId: id }}]}));
    };

    const onChangeFunction = () => {
        if(gps.error){
            Alert.alert(t('alert'), t('always_on'));
        } else {
            let res = !auth.profile.driverActiveStatus;
            if(res === true) dispatch(fetchTasks());
            dispatch(updateProfile({ driverActiveStatus: res }));
        }
    }

    const onTermAccept =  () => {
        if(checks.term == false){
           dispatch(updateProfile({term: true}));
           dispatch(fetchTasks()) ;  
       }
   }
    const  onTermLink  = async () => {
        Linking.openURL(settings.CompanyTermCondition).catch(err => console.error("Couldn't load page", err));
   }
    useEffect(() => {
        if (gps.location) {
            if (gps.location.lat && gps.location.lng) {
                setRegion({
                    latitude: gps.location.lat,
                    longitude: gps.location.lng,
                    latitudeDelta: latitudeDelta,
                    longitudeDelta: longitudeDelta
                });
            }
        }
    }, [gps.location]);

    useEffect(() => {
        if (gps.error) {
            dispatch(updateProfile({ driverActiveStatus: false }));
            setChecks({...checks,driverActiveStatus:false});
        }
    }, [gps.error]);


    const rCom = () => {
        return (
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.WHITE, fontWeight: 'bold', marginRight: Platform.OS == 'ios' ? 10 : 0 }}>{t('on_duty')}</Text>
                <Switch
                    value={auth.profile.uid ? auth.profile.driverActiveStatus : false}
                    onValueChange={onChangeFunction}
                    style={{ marginTop: Platform.OS == 'android' ? 3 : 0 }}
                />
            </View>
        );
    }

    const navEditUser = () => {
        props.navigation.dispatch(CommonActions.reset({index: 0, routes:[{ name: 'editUser', params: { fromPage: 'DriverTrips'} }]}));
    }


    React.useEffect(() => {
        props.navigation.setOptions({
            headerRight: rCom,
        });
    }, [props.navigation]);

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('focus', () => {
            pageActive.current = true;
        });
        return unsubscribe;
    }, [props.navigation, pageActive.current]);

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('blur', () => {
            pageActive.current = false;
        });
        return unsubscribe;
    }, [props.navigation, pageActive.current]);

    useEffect(() => {
        pageActive.current = true;
        return () => {
            pageActive.current = false;
        };
    }, []);

    const changePermission = async () => {
        let permResp = await Location.requestForegroundPermissionsAsync();
        if (permResp.status == 'granted') {
            let { status } = await Location.requestBackgroundPermissionsAsync();
            if (status === 'granted') {
                dispatch(updateProfile({ driverActiveStatus: true }));
                setChecks({...checks,driverActiveStatus:true});
            }
        }
        else{
            if(Platform.OS == 'ios'){
                Linking.openSettings()
            } else{
                startActivityAsync(ActivityAction.LOCATION_SOURCE_SETTINGS);
            }
        }
    }


    return (
        <View style={styles.mainViewStyle}>
            <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : (__DEV__ ? null : "padding" )}>
            <FlatList
                data={auth.profile && auth.profile.uid && auth.profile.driverActiveStatus ?
                    (appConsts && appConsts.showBookingOptions ? tasks ? tasks : activeBookings : auth.profile.queue ? activeBookings : tasks) : []}
                keyExtractor={(item, index) => index.toString()}
                ListEmptyComponent={
                    <View style={{ height: height, width: width }}>
                        {region && region.latitude && pageActive.current && auth.profile ?
                            <MapView
                                region={{
                                    latitude: region.latitude,
                                    longitude: region.longitude,
                                    latitudeDelta: latitudeDelta,
                                    longitudeDelta: longitudeDelta
                                }}
                                minZoomLevel={13}
                                provider={PROVIDER_GOOGLE}
                                style={{ minHeight: height - 60, height: height - (Platform.OS == 'android' ? 15 : 60), width: width }}
                            >
                                <Marker
                                    coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                                    pinColor={colors.HEADER}
                                >
                                    <View style={{ alignItems: 'center' }}>
                                        <View style={{ alignItems: 'center', backgroundColor: '#fff', opacity: 0.8, borderColor: '#000', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 5, marginBottom: 5 }}>
                                            <Text style={{ fontWeight: 'bold', color: colors.BUTTON_ORANGE }}>{t('where_are_you')}</Text>
                                            <Text style={{ fontWeight: 'bold', color: colors.BUTTON_ORANGE }}>{auth.profile.driverActiveStatus ? t('rider_not_here') : t('service_off')}</Text>
                                        </View>
                                        <Image
                                            source={carImageIcon}
                                            style={{ height: 40, width: 40 }}
                                        />
                                    </View>
                                </Marker>
                            </MapView>
                            :
                            gps.error ?
                                <View style={{ alignItems: 'center', justifyContent: 'center', height: height, width: width }}>
                                    <Text>{t('location_permission_error')}</Text>
                                </View>
                                :
                                <View style={{ alignItems: 'center', justifyContent: 'center', height: height, width: width }}>
                                    <Text>{t('loading')}</Text>
                                </View>
                        }
                        {gps.error || (!checks.carExists && settings.carType_required) || (!checks.carApproved && settings.carType_required) ||(!checks.licenseAvailable && settings.license_image_required) || !checks.approved || !checks.driverActiveStatus || (settings && settings.imageIdApproval && !checks.imageIdApproval) || (!checks.term && settings.term_required) ?
                            <View style={{
                                top: 0, left: 0, position: 'absolute', width: width - 20, margin: 10, borderRadius: 8, flexDirection: 'column', alignItems: 'center', backgroundColor: colors.new,
                                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 4, elevation: 5,
                                height: 10 +(gps.error ? 70 : 0) + (!checks.driverActiveStatus ? 70 : 0) + (!checks.carExists && settings.carType_required ? 70 : 0) + (!checks.carApproved && settings.carType_required ? 70 : 0) + (!checks.approved ? 70 : 0) + (!checks.licenseAvailable && settings.license_image_required ? 70 : 0) + (settings && settings.imageIdApproval && !checks.imageIdApproval ? 70 : 0) + (!checks.term && settings.term_required ? 70 : 0)
                            }}>
                                {gps.error?
                                    <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                        <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                            <Icon name="alert-circle" type="ionicon" color={colors.RED} size={18} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('always_on')}</Text>
                                        </View>
                                        <Button onPress={changePermission}  title={t('fix')} titleStyle={styles.checkButtonTitle} buttonStyle={styles.checkButtonStyle} />
                                    </View>
                                    : null}
                                {!checks.carExists && settings.carType_required ?
                                          <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                            <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                            <Icon name="alert-circle" type="ionicon" color={colors.RED} size={18} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('no_car_assign_text')}</Text>
                                        </View>
                                        <Button onPress={() => props.navigation.dispatch(CommonActions.reset({index: 0, routes:[{ name: 'Cars', params: { fromPage: 'DriverTrips'}}]}))}
                                            title={t('cars')} titleStyle={styles.checkButtonTitle} buttonStyle={styles.checkButtonStyle} />
                                    </View>
                                    : null}
                                {!checks.carApproved && settings.carType_required ?
                                         <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                            <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                            <Icon name="alert-circle" type="ionicon" color={colors.RED} size={16} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('carApproved_by_admin')}</Text>
                                        </View>
                                    </View>
                                    : null}
                                {!checks.licenseAvailable && settings.license_image_required ?
                                        <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                            <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                            <Icon name="alert-circle" type="ionicon" color={colors.RED} size={16} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('upload_driving_license')}</Text>
                                        </View>
                                        <Button onPress={navEditUser} title={t('profile')} titleStyle={styles.checkButtonTitle} buttonStyle={styles.checkButtonStyle} />
                                    </View>
                                    : null}
                                {!checks.approved ?
                                         <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                            <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                            <Icon name="alert-circle" type="ionicon" color={colors.RED} size={18} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('admin_contact')}</Text>
                                        </View>
                                    </View>
                                    : null}
                                {!checks.driverActiveStatus ?
                                         <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                            <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                            <Icon name="alert-circle" type="ionicon" color={colors.RED} size={18} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('driver_active')}</Text>
                                        </View>
                                        <Button onPress={onChangeFunction} title={t('make_active')} titleStyle={styles.checkButtonTitle} buttonStyle={styles.checkButtonStyle} />
                                    </View>
                                    : null}
                                {settings && settings.imageIdApproval && !checks.imageIdApproval ?
                                     <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                        <View style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row'}]}>
                                        <Icon name="alert-circle" type="ionicon" color={colors.RED} size={18} />
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.BLACK, marginLeft: 3 }}>{t('upload_id_details')}</Text>
                                    </View>
                                    <Button onPress={navEditUser} title={t('profile')} titleStyle={styles.checkButtonTitle} buttonStyle={styles.checkButtonStyle} />
                                </View>
                                : null}
                                {!checks.term && settings.term_required ?
                                         <View style={[styles.alrt,{flexDirection:isRTL?'row-reverse':'row'}]}>
                                            <TouchableOpacity onPress={onTermLink} style={[styles.alrt1,{flexDirection:isRTL? 'row-reverse':'row',width:width-180,height:50}]}>
                                            <Icon name="document-text" type="ionicon" color={colors.RED} size={18} />
                                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.SKY, marginLeft: 3,textDecorationLine:'underline' }}>{t('term_condition')}</Text>
                                        </TouchableOpacity>
                                        <Button onPress={onTermAccept} title={t('accept')} titleStyle={styles.checkButtonTitle} buttonStyle={styles.checkButtonStyle} />
                                    </View>
                                    : null}
                            </View>
                            : null}
                    </View>
                }
                renderItem={({ item, index }) => {
                    return (
                        <KeyboardAvoidingView  behavior="position" style={styles.listItemView}>
                        {/* <View style={styles.listItemView}> */}
                            <View style={[styles.mapcontainer, activeBookings && activeBookings.length >= 1 ? { height: height - 500 } : null]}>
                                <MapView style={styles.map}
                                    provider={PROVIDER_GOOGLE}
                                    minZoomLevel={13}
                                    initialRegion={{
                                        latitude: item.pickup.lat,
                                        longitude: item.pickup.lng,
                                        latitudeDelta: activeBookings && activeBookings.length >= 1 ? 0.0922 : 0.0822,
                                        longitudeDelta: activeBookings && activeBookings.length >= 1 ? 0.0421 : 0.0321
                                    }}
                                >
                                    <Marker
                                        coordinate={{ latitude: item.pickup.lat, longitude: item.pickup.lng }}
                                        title={item.pickup.add}
                                        description={t('pickup_location')}
                                        pinColor={colors.GREEN_DOT}
                                    />

                                    <Marker
                                        coordinate={{ latitude: item.drop.lat, longitude: item.drop.lng }}
                                        title={item.drop.add}
                                        description={t('drop_location')}
                                    />
                                    {item.waypoints && item.waypoints.length > 0 ? item.waypoints.map((point, index) => {
                                        return (
                                            <Marker
                                                coordinate={{ latitude: point.lat, longitude: point.lng }}
                                                pinColor={colors.RED}
                                                title={point.add}
                                                key={index}
                                            >
                                            </Marker>
                                        )
                                    })
                                        : null}
                                    {item.coords ?
                                        <Polyline
                                            coordinates={item.coords}
                                            strokeWidth={4}
                                            strokeColor={colors.INDICATOR_BLUE}
                                        />
                                        : null}
                                </MapView>
                            </View>

                            <View style={styles.mapDetails}>
                                <View style={styles.dateView}>
                                    <View>
                                        <Text style={styles.listDate}>{moment(item.tripdate).format('lll')}</Text>
                                    </View>
                                    <RateView
                                        uid={auth.profile.uid}
                                        settings={settings}
                                        item={item}
                                        styles={styles}
                                    />
                                    <View style={[styles.estimateView, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        <Text style={styles.listEstimate}>{item.estimateDistance ? parseFloat(item.estimateDistance).toFixed(settings.decimal) : 0} {settings.convert_to_mile ? t('mile') : t('km')}</Text>
                                        <Text style={styles.listEstimate}>{item.estimateTime ? parseFloat(item.estimateTime / 60).toFixed(0) : 0} {t('mins')}</Text>
                                    </View>
                                </View>
                                <View style={[styles.addressViewStyle, isRTL ? { paddingRight: 10 } : { paddingLeft: 10 }]}>
                                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                        <View style={styles.greenDot}></View>
                                        <Text style={[styles.addressViewTextStyle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }, { textAlign: isRTL ? 'right' : 'left' }]}>{item.pickup.add}</Text>
                                    </View>
                                    {item.waypoints && item.waypoints.length > 0 ? item.waypoints.map((point, index) => {
                                        return (
                                            <View key={"key" + index} style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                                <View style={styles.redDot}></View>
                                                <Text style={[styles.addressViewTextStyle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }, { textAlign: isRTL ? 'right' : 'left' }]}>{point.add}</Text>
                                            </View>
                                        )
                                    })
                                        : null}
                                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                                        <View style={styles.redDot}></View>
                                        <Text style={[styles.addressViewTextStyle, isRTL ? { marginRight: 10 } : { marginLeft: 10 }, { textAlign: isRTL ? 'right' : 'left' }]}>{item.drop.add}</Text>
                                    </View>                                    
                                </View>
                                <ExtraInfo 
                                    item={item}
                                    uid={auth.profile.uid}
                                    amount={amount}
                                    setAmount={setAmount}
                                    styles={styles}
                                    onPressAccept={onPressAccept}
                                />
                                {item && item.status != 'NEW' ?
                                    <View style={styles.detailsBtnView}>
                                        <View style={{ flex: 1 }}>
                                            <Button
                                                onPress={() => {
                                                    goToBooking(item.id);
                                                }}
                                                title={t('go_to_booking')}
                                                titleStyle={styles.titleStyles}
                                                buttonStyle={{
                                                    backgroundColor: colors.DRIVER_TRIPS_BUTTON,
                                                    width: 180,
                                                    height: 50,
                                                    padding: 2,
                                                    borderColor: colors.TRANSPARENT,
                                                    borderWidth: 0,
                                                    borderRadius: 5,
                                                }}
                                                containerStyle={{
                                                    flex: 1,
                                                    alignSelf: 'center',
                                                    paddingRight: 14
                                                }}
                                            />
                                        </View>
                                    </View>
                                    :
                                    <View style={[styles.detailsBtnView, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                        <View style={{ flex: 1 }}>
                                            <Button
                                                onPress={() => {
                                                    setModalVisible(true);
                                                    setSelectedItem(item);
                                                }}
                                                title={t('ignore_text')}
                                                titleStyle={styles.titleStyles}
                                                buttonStyle={[styles.btn, { backgroundColor: colors.LIGHT_RED }]}
                                                containerStyle={{
                                                    flex: 1,
                                                    alignSelf: isRTL ? 'flex-start' : 'flex-end',
                                                    paddingRight: isRTL ? 0 : 14,
                                                    paddingLeft: isRTL ? 14 : 0
                                                }}
                                            />
                                        </View>
                                        {!appConsts.acceptWithAmount|| (appConsts.acceptWithAmount && !(item.driverOffers && item.driverOffers[auth.profile.uid])) ?
                                            <View style={styles.viewFlex1}>
                                                <Button
                                                    title={t('accept')}
                                                    titleStyle={styles.titleStyles}
                                                    onPress={() => {
                                                        onPressAccept(item, amount[item.id])
                                                    }}
                                                    buttonStyle={[styles.btn, { backgroundColor: colors.DRIVER_TRIPS_BUTTON }]}
                                                    containerStyle={{
                                                        flex: 1,
                                                        alignSelf: isRTL ? 'flex-end' : 'flex-start',
                                                        paddingRight: isRTL ? 14 : 0,
                                                        paddingLeft: isRTL ? 0 : 14
                                                    }}
                                                />
                                            </View>
                                            : null}
                                    </View>
                                }
                            </View>
                           {/* </View> */}
                        </KeyboardAvoidingView> 
                    )
                }
                }
            />
             </KeyboardAvoidingView>
            <View style={styles.modalPage}>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        Alert.alert(t('modal_close'));
                    }}>
                    <View style={styles.modalMain}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeading}>
                                <Text style={styles.alertStyle}>{t('alert_text')}</Text>
                            </View>
                            <View style={styles.modalBody}>
                                <Text style={{ fontSize: 16 }}>{t('ignore_job_title')}</Text>
                            </View>
                            <View style={[styles.modalFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <TouchableHighlight
                                    style={isRTL ? [styles.btnStyle] : [styles.btnStyle, styles.clickText]}
                                    onPress={() => {
                                        setModalVisible(!modalVisible);
                                        setSelectedItem(null);
                                    }}>
                                    <Text style={styles.cancelTextStyle}>{t('cancel')}</Text>
                                </TouchableHighlight>
                                <TouchableHighlight
                                    style={isRTL ? [styles.btnStyle, styles.clickText] : [styles.btnStyle]}
                                    onPress={() => {
                                        onPressIgnore(selectedItem.id)
                                    }}>
                                    <Text style={styles.okStyle}>{t('ok')}</Text>
                                </TouchableHighlight>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    alrt:{
        width: width - 40, 
        height: 60, 
        marginTop: 10, 
        padding: 10, 
        borderWidth: 1, 
        borderColor: colors.BORDER_BACKGROUND, 
        borderRadius: 5, 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    alrt1:{
        justifyContent: 'flex-start', 
        alignItems: 'center' 
    },
    headerStyle: {
        backgroundColor: colors.HEADER,
        borderBottomWidth: 0
    },
    headerInnerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    btn: {
        width: 110,
        borderRadius: 10,
        height: 55,
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20,
        marginTop: 3
    },
    mapcontainer: {
        width: width,
        height: 210,
        borderColor: colors.HEADER,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapDetails: {
        backgroundColor: colors.WHITE,
        flex: 1,
        flexDirection: 'column',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        width: '98%',
        alignSelf: 'center',
        borderRadius: 15,
        marginTop: -10
    },
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden'
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: colors.TRANSPARENT,
        borderStyle: 'solid',
        borderLeftWidth: 9,
        borderRightWidth: 9,
        borderBottomWidth: 10,
        borderLeftColor: colors.TRANSPARENT,
        borderRightColor: colors.TRANSPARENT,
        borderBottomColor: colors.BOX_BG,
        transform: [
            { rotate: '180deg' }
        ]
    },
    signInTextStyle: {
        fontFamily: 'Roboto-Bold',
        fontWeight: "700",
        color: colors.WHITE
    },
    listItemView: {
        flex: 1,
        width: '100%',
        marginBottom: 10,
        flexDirection: 'column',
    },
    dateView: {
        backgroundColor: colors.new,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        marginBottom: 10,
    },
    listDate: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingLeft: 10,
        color: colors.BLACK,
        alignSelf: 'center',
        marginTop: 5
    },
    estimateView: {
        flex: 1.1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 10
    },
    listEstimate: {
        fontSize: 20,
        color: colors.DRIVER_TRIPS_TEXT,
    },
    addressViewStyle: {
        flex: 2,
    },
    no_driver_style: {
        color: colors.DRIVER_TRIPS_TEXT,
        fontSize: 18,
    },
    addressViewTextStyle: {
        color: colors.DRIVER_TRIPS_TEXT,
        fontSize: 15,
        lineHeight: 24,
        flexWrap: "wrap",
    },
    greenDot: {
        backgroundColor: colors.GREEN_DOT,
        width: 10,
        height: 10,
        borderRadius: 50
    },
    redDot: {
        backgroundColor: colors.RED,
        width: 10,
        height: 10,
        borderRadius: 50
    },
    detailsBtnView: {
        flex: 2,
        justifyContent: 'space-between',
        width: width,
        marginTop: 20,
        marginBottom: 20
    },

    modalPage: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalMain: {
        flex: 1,
        backgroundColor: colors.BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContainer: {
        width: '80%',
        backgroundColor: colors.WHITE,
        borderRadius: 10,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 15,
        flex: 1,
        maxHeight: 180
    },
    modalHeading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalBody: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalFooter: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopColor: colors.FOOTERTOP,
        borderTopWidth: 1,
        width: '100%',
    },
    btnStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainViewStyle: {
        flex: 1
    },
    myButtonStyle: {
        backgroundColor: colors.RED,
        width: height / 6,
        padding: 2,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 5,
    },
    alertStyle: {
        fontWeight: 'bold',
        fontSize: 18,
        width: '100%',
        textAlign: 'center'
    },
    cancelTextStyle: {
        color: colors.INDICATOR_BLUE,
        fontSize: 18,
        fontWeight: 'bold',
        width: "100%",
        textAlign: 'center'
    },
    okStyle: {
        color: colors.INDICATOR_BLUE,
        fontSize: 18,
        fontWeight: 'bold'
    },
    viewFlex1: {
        flex: 1
    },
    clickText: {
        borderRightColor: colors.DRIVER_TRIPS_TEXT,
        borderRightWidth: 1
    },
    titleStyles: {
        width: "100%",
        alignSelf: 'center'
    },
    rateViewStyle: {
        alignItems: 'center',
        flex: 2,
        marginBottom: 0
    },
    rateViewTextStyle: {
        fontSize: 25,
        color: colors.BLACK,
        fontFamily: 'Roboto-Bold',
        fontWeight: 'bold',
        textAlign: "center"
    },
    textContainerStyle: {
        flexDirection: 'row',
        alignItems: "flex-start",
        marginLeft: 35,
        marginRight: 35,
        marginTop: 10
    },
    textContainerStyle2: {
        flexDirection: 'column',
        alignItems: "flex-start",
        marginLeft: 35,
        marginRight: 35,
        marginTop: 10
    },
    textHeading: {
        fontWeight: 'bold',
        color: colors.DRIVER_TRIPS_TEXT,
        fontSize: 15,
    },
    textContent: {
        color: colors.DRIVER_TRIPS_TEXT,
        fontSize: 15,
        marginLeft: 3,
    },
    textContent2: {
        marginTop: 4,
        color: colors.DRIVER_TRIPS_TEXT,
        fontSize: 15
    },
    box: {
        height: 45,
        backgroundColor: colors.WHITE,
        marginTop: 10,
        marginLeft: 20,
        marginRight: 20,
        borderWidth: 1,
        borderColor: colors.BLACK,
        justifyContent: 'center',
        borderRadius: 10
    },
    labelStyle: {
        fontFamily: 'Roboto',
        fontSize: 13,
        color: colors.BLACK,
        marginTop: 15,
        alignSelf: 'center'
    },
    dateTextStyle: {
        marginLeft: 14,
        fontFamily: 'Roboto-Bold',
        fontSize: 14,
        fontWeight: '400',
        color: colors.BLACK
    },
    checkButtonStyle: {
        backgroundColor: colors.DRIVER_TRIPS_BUTTON,
        width: 100,
        height: 40,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        borderRadius: 5
    },
    checkButtonTitle: {
        fontFamily: 'Roboto-Bold',
        fontSize: 12,
        fontWeight: '400',
        color: colors.BLACK
    }

});
