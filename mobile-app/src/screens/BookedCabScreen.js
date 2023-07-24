import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Image,
    Dimensions,
    TouchableOpacity,
    Text,
    Platform,
    Modal,
    Linking,
    Alert,
    Share,
    ScrollView
} from 'react-native';
import { TouchableOpacity as OldTouch } from 'react-native';
import { Icon, Button } from 'react-native-elements';
import MapView, { Polyline, PROVIDER_GOOGLE, Marker, AnimatedRegion } from 'react-native-maps';
import { OtpModal } from '../components';
import StarRating from 'react-native-star-rating-widget';
import RadioForm from 'react-native-simple-radio-button';
import { colors } from '../common/theme';
var { width, height } = Dimensions.get('window');
import i18n from 'i18n-js';
import { useSelector, useDispatch } from 'react-redux';
import * as DecodePolyLine from '@mapbox/polyline';
import carImageIcon from '../../assets/images/track_Car.png';
import { api } from 'common';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment/min/moment-with-locales';
import { CommonActions } from '@react-navigation/native';
import { appConsts } from '../common/sharedFunctions';

const hasNotch = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS && ((height === 780 || width === 780) || (height === 812 || width === 812) || (height === 844 || width === 844) || (height === 896 || width === 896) || (height === 926 || width === 926))
export default function BookedCabScreen(props) {
    const {
        fetchBookingLocations,
        stopLocationFetch,
        updateBookingImage,
        cancelBooking,
        updateBooking,
        getDirectionsApi
    } = api;
    const dispatch = useDispatch();
    const { bookingId } = props.route.params;
    const latitudeDelta = 0.0922;
    const longitudeDelta = 0.0421;
    const [alertModalVisible, setAlertModalVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const activeBookings = useSelector(state => state.bookinglistdata.active);
    const [curBooking, setCurBooking] = useState(null);
    const cancelReasons = useSelector(state => state.cancelreasondata.complex);
    const auth = useSelector(state => state.auth);
    const [cancelReasonSelected, setCancelReasonSelected] = useState(0);
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const lastLocation = useSelector(state => state.locationdata.coords);
    const [liveRouteCoords, setLiveRouteCoords] = useState(null);
    const mapRef = useRef();
    const pageActive = useRef();
    const [lastCoords, setlastCoords] = useState();
    const [arrivalTime, setArrivalTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [purchaseInfoModalStatus, setPurchaseInfoModalStatus] = useState(false);
    const [userInfoModalStatus, setUserInfoModalStatus] = useState(false);
    const settings = useSelector(state => state.settingsdata.settings);

    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;

    const [role, setRole] = useState();

    useEffect(() => {
        if (auth.profile && auth.profile.usertype) {
            setRole(auth.profile.usertype);
        } else {
            setRole(null);
        }
    }, [auth.profile]);

    useEffect(() => {
        setInterval(() => {
            if (pageActive.current && curBooking && lastLocation && (curBooking.status == 'ACCEPTED' || curBooking.status == 'STARTED')) {
                if (lastCoords && lastCoords.lat != lastLocation.lat && lastCoords.lat != lastLocation.lng) {
                    if (curBooking.status == 'ACCEPTED') {
                        let point1 = { lat: lastLocation.lat, lng: lastLocation.lng };
                        let point2 = { lat: curBooking.pickup.lat, lng: curBooking.pickup.lng };
                        fitMap(point1, point2);
                    } else {
                        let point1 = { lat: lastLocation.lat, lng: lastLocation.lng };
                        let point2 = { lat: curBooking.drop.lat, lng: curBooking.drop.lng };
                        fitMap(point1, point2);
                    }
                    setlastCoords(lastLocation);
                }
            }
        }, 20000);
    }, []);


    useEffect(() => {
        if (lastLocation && curBooking && curBooking.status == 'ACCEPTED' && pageActive.current) {
            let point1 = { lat: lastLocation.lat, lng: lastLocation.lng };
            let point2 = { lat: curBooking.pickup.lat, lng: curBooking.pickup.lng };
            fitMap(point1, point2);
            setlastCoords(lastLocation);
        }

        if (curBooking && curBooking.status == 'ARRIVED' && pageActive.current) {
            setlastCoords(null);
            setTimeout(() => {
                mapRef.current.fitToCoordinates([{ latitude: curBooking.pickup.lat, longitude: curBooking.pickup.lng }, { latitude: curBooking.drop.lat, longitude: curBooking.drop.lng }], {
                    edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                    animated: true,
                })
            }, 1000);
        }
        if (lastLocation && curBooking && curBooking.status == 'STARTED' && pageActive.current) {
            let point1 = { lat: lastLocation.lat, lng: lastLocation.lng };
            let point2 = { lat: curBooking.drop.lat, lng: curBooking.drop.lng };
            fitMap(point1, point2);
            setlastCoords(lastLocation);
        }
        if (lastLocation && curBooking && curBooking.status == 'REACHED' && role == 'customer' && pageActive.current) {
            setTimeout(() => {
                mapRef.current.fitToCoordinates([{ latitude: curBooking.pickup.lat, longitude: curBooking.pickup.lng }, { latitude: lastLocation.lat, longitude: lastLocation.lng }], {
                    edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                    animated: true,
                })
            }, 1000);
        }
    }, [lastLocation, curBooking, pageActive.current])

    const fitMap = (point1, point2) => {
        let startLoc = point1.lat + ',' + point1.lng;
        let destLoc = point2.lat + ',' + point2.lng;
        if (settings.showLiveRoute) {
            getDirectionsApi(startLoc, destLoc, null).then((details) => {
                setArrivalTime(details.time_in_secs ? parseFloat(details.time_in_secs / 60).toFixed(0) : 0);
                let points = DecodePolyLine.decode(details.polylinePoints);
                let coords = points.map((point, index) => {
                    return {
                        latitude: point[0],
                        longitude: point[1]
                    }
                })
                setLiveRouteCoords(coords);
                if(mapRef.current){
                    mapRef.current.fitToCoordinates([{ latitude: point1.lat, longitude: point1.lng }, { latitude: point2.lat, longitude: point2.lng }], {
                        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                        animated: true,
                    })
                }
            }).catch(()=>{

            });
        } else {
            mapRef.current.fitToCoordinates([{ latitude: point1.lat, longitude: point1.lng }, { latitude: point2.lat, longitude: point2.lng }], {
                edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                animated: true,
            })
        }
    }


    useEffect(() => {
        if (activeBookings && activeBookings.length >= 1) {
            let booking = activeBookings.filter(booking => booking.id == bookingId)[0];
            if (booking) {
                setCurBooking(booking);
                let diffMins = ((new Date(booking.tripdate)) - (new Date())) / (1000 * 60);
                if (booking.status == 'NEW' && (booking.bookLater == false || (booking.bookLater && diffMins <= 15))) {
                    if (role == 'customer') setTimeout(() => setSearchModalVisible(true), Platform.OS === "ios" ? 200 : 0);  
                    if (role == 'customer' && booking.selectedBid && !booking.customer_paid){
                        setTimeout(()=>{
                            setSearchModalVisible(false);
                            props.navigation.navigate('PaymentDetails', { booking:{...booking, ...booking.selectedBid }});
                        },2000)
                    }
                }
                if (booking.status == 'ACCEPTED') {
                    if (role == 'customer') setSearchModalVisible(false);
                    if (role == 'customer') dispatch(fetchBookingLocations(bookingId));
                }
                if (booking.status == 'ARRIVED') {
                    if (role == 'customer') dispatch(fetchBookingLocations(bookingId));
                }
                if (booking.status == 'STARTED') {
                    if (role == 'customer') dispatch(fetchBookingLocations(bookingId));
                }
                if (booking.status == 'REACHED') {
                    if (role == 'driver') {
                        setTimeout(() => {
                            props.navigation.dispatch(CommonActions.reset({index: 0,routes: [{ name: 'PaymentDetails', params: { booking: booking }}]}));
                        }, 1000);
                    }
                }
                if (booking.status == 'PENDING') {
                    if (role == 'customer') {
                        setTimeout(() => {
                            props.navigation.navigate('PaymentDetails', { booking: booking });
                        }, 1000);
                    }
                }
                if (booking.status == 'PAID' & pageActive.current) {
                    if (role == 'customer') {
                        setTimeout(() => {
                            props.navigation.navigate('DriverRating', { bookingId: booking });
                        }, 1000);
                    }
                    if (role == 'driver') {
                        props.navigation.dispatch(CommonActions.reset({index: 0,routes: [{ name: 'TabRoot'}]}));
                    }
                }
                if ((booking.status == 'ACCEPTED' || booking.status == 'ARRIVED') && booking.pickup_image) {
                    setLoading(false);
                }
                if (booking.status == 'STARTED' && booking.deliver_image) {
                    setLoading(false);
                }
            }
            else {
                setModalVisible(false);
                setSearchModalVisible(false);
                props.navigation.navigate('TabRoot', { screen: 'RideList', params: { fromBooking: true } });
            }
        }
        else {
            setModalVisible(false);
            setSearchModalVisible(false);
            if (role == 'driver') {
                props.navigation.dispatch(CommonActions.reset({index: 0,routes: [{ name: 'TabRoot'}]}));
            } else {
                props.navigation.navigate('TabRoot', { screen: 'RideList', params: { fromBooking: true } });
            }
        }
    }, [activeBookings, role, pageActive.current]);

    const renderButtons = () => {
        return (
            (curBooking && role == 'customer' && (curBooking.status == 'NEW' || curBooking.status == 'ACCEPTED')) ||
                (curBooking && role == 'driver' && (curBooking.status == 'ACCEPTED' || curBooking.status == 'ARRIVED' || curBooking.status == 'STARTED')) ?
                <View style={{ flex: 1.5, flexDirection:isRTL? 'row-reverse':'row' }}>
                    {(role == 'customer' && !curBooking.pickup_image && (curBooking.status == 'NEW' || curBooking.status == 'ACCEPTED')) ||
                        (role == 'driver' && !curBooking.pickup_image && (curBooking.status == 'ACCEPTED' || curBooking.status == 'ARRIVED')) ?
                        <View style={{ flex: 1 }}>
                            <Button
                                title={t('cancel_ride')}
                                loading={false}
                                loadingProps={{ size: "large", color: colors.INDICATOR_BLUE }}
                                titleStyle={{ color: colors.WHITE, fontWeight: 'bold' }}
                                onPress={() => {
                                    role == 'customer' ?
                                        setModalVisible(true) :
                                        Alert.alert(
                                            t('alert'),
                                            t('cancel_confirm'),
                                            [
                                                { text: t('cancel'), onPress: () => { }, style: 'cancel' },
                                                { text: t('ok'), onPress: () => dispatch(cancelBooking({ booking: curBooking, reason: t('driver_cancelled_booking'), cancelledBy: role })) },
                                            ]
                                        );
                                }
                                }
                                buttonStyle={{ height: '100%', backgroundColor: colors.HEADER }}
                                containerStyle={{ height: '100%' }}
                            />
                        </View>
                        : null}
                    {appConsts.captureBookingImage && settings.AllowDeliveryPickupImageCapture && role == 'driver' && !curBooking.pickup_image && (curBooking.status == 'ACCEPTED' || curBooking.status == 'ARRIVED') ?
                        <View style={{ flex: 1 }}>
                            <Button
                                title={t('take_pickup_image')}
                                loading={loading}
                                loadingProps={{ size: "large", color: colors.WHITE }}
                                onPress={() => _pickImage(ImagePicker.launchCameraAsync)}
                                buttonStyle={{ height: '100%', backgroundColor: colors.BUTTON_ORANGE }}
                                containerStyle={{ height: '100%' }}
                            />
                        </View>
                        : null}
                    {role == 'driver' && (!appConsts.captureBookingImage  || (curBooking.pickup_image && appConsts.captureBookingImage) || (!settings.AllowDeliveryPickupImageCapture && appConsts.captureBookingImage)) && (curBooking.status == 'ACCEPTED' || curBooking.status == 'ARRIVED') ?
                        <View style={{ flex: 1 }}>
                            <Button
                                title={t('start_trip')}
                                loading={false}
                                loadingProps={{ size: "large", color: colors.WHITE }}
                                titleStyle={{ color: colors.WHITE, fontWeight: 'bold' }}
                                onPress={() => {
                                    if (curBooking.otp && appConsts.hasStartOtp) {
                                        setOtpModalVisible(true);
                                    } else {
                                        startBooking();
                                    }
                                }}
                                buttonStyle={{ height: '100%', backgroundColor: colors.START_TRIP }}
                                containerStyle={{ height: '100%' }}
                            />
                        </View>
                        : null}

                    {appConsts.captureBookingImage && settings.AllowFinalDeliveryImageCapture && role == 'driver' && !curBooking.deliver_image && curBooking.status == 'STARTED' ?
                        <View style={{ flex: 1 }}>
                            <Button
                                title={t('take_deliver_image')}
                                loading={loading}
                                loadingProps={{ size: "large", color: colors.WHITE }}
                                titleStyle={{ color: colors.WHITE, fontWeight: 'bold' }}
                                onPress={() => _pickImage(ImagePicker.launchCameraAsync)}
                                buttonStyle={{ height: '100%', backgroundColor: colors.BUTTON_ORANGE }}
                                containerStyle={{ height: '100%' }}
                            />
                        </View>
                        : null}
                    {role == 'driver' && (!appConsts.captureBookingImage || (curBooking.deliver_image && appConsts.captureBookingImage) || (!settings.AllowFinalDeliveryImageCapture && appConsts.captureBookingImage)) && curBooking.status == 'STARTED' ?
                        <View style={{ flex: 1 }}>
                            <Button
                                title={t('complete_ride')}
                                loading={loading}
                                titleStyle={{ color: colors.WHITE, fontWeight: 'bold' }}
                                onPress={() => {
                                    if (curBooking.otp && !appConsts.hasStartOtp) {
                                        setOtpModalVisible(true);
                                    } else {
                                        endBooking();
                                    }
                                }}
                                buttonStyle={{ height: '100%', backgroundColor: colors.RED }}
                                containerStyle={{ height: '100%' }}
                            />
                        </View>
                        : null}
                </View>
                : null
        );
    }

    const startBooking = () => {
        setOtpModalVisible(false);
        let booking = { ...curBooking };
        booking.status = 'STARTED';
        dispatch(updateBooking(booking));
    }

    const endBooking = () => {
        setLoading(true);
        let booking = { ...curBooking };
        booking.status = 'REACHED';
        dispatch(updateBooking(booking));
        setOtpModalVisible(false);
    }

    const acceptBid = (item) => {
        let bookingObj = {...curBooking};
        if((bookingObj.payment_mode === 'wallet' && parseFloat(auth.profile.walletBalance) >= item.trip_cost) || bookingObj.payment_mode === 'cash' || bookingObj.payment_mode === 'card'){
            bookingObj.selectedBid = item;
            for(let key in bookingObj.driverOffers){
                if(key !== item.driver){
                   delete  bookingObj.driverOffers[key];
                }
            }
            for(let key in bookingObj.requestedDrivers){
                if(key !== item.driver){
                   delete  bookingObj.requestedDrivers[key];
                }
            }
            dispatch(updateBooking(bookingObj));
        } else {
            Alert.alert(t('alert'),t('wallet_balance_low'));
        }
    }

    const startNavigation = () => {
        let url = 'https://www.google.com/maps/dir/?api=1&travelmode=driving';
        if (curBooking.status == 'ACCEPTED') {
            url = url + '&destination=' + curBooking.pickup.lat + "," + curBooking.pickup.lng;
            Linking.openURL(url);
        }
        else if (curBooking.status == 'STARTED') {
            url = url + '&destination=' + curBooking.drop.lat + "," + curBooking.drop.lng;
            Linking.openURL(url);
        } else {
            Alert.alert(t('alert'), t('navigation_available'));
        }
    }

    const alertModal = () => {
        return (
            <Modal
                animationType="none"
                transparent={true}
                visible={alertModalVisible}
                onRequestClose={() => {
                    setAlertModalVisible(false);
                }}>
                <View style={styles.alertModalContainer}>
                    <View style={styles.alertModalInnerContainer}>

                        <View style={styles.alertContainer}>

                            <Text style={styles.rideCancelText}>{t('rider_cancel_text')}</Text>

                            <View style={styles.horizontalLLine} />

                            <View style={styles.msgContainer}>
                                <Text style={styles.cancelMsgText}>{t('cancel_messege1')}  {bookingId} {t('cancel_messege2')} </Text>
                            </View>
                            <View style={styles.okButtonContainer}>
                                <Button
                                    title={t('no_driver_found_alert_OK_button')}
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => {
                                        setAlertModalVisible(false);
                                        props.navigation.popToTop();
                                    }}
                                    buttonStyle={styles.okButtonStyle}
                                    containerStyle={styles.okButtonContainerStyle}
                                />
                            </View>

                        </View>

                    </View>
                </View>

            </Modal>
        )
    }

    const goBack = () => {
        props.navigation.dispatch(CommonActions.reset({index: 0,routes: [{ name: 'TabRoot'}]}));
    }

    const cancelModal = () => {
        return (
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}>
                <View style={styles.cancelModalContainer}>
                    <View style={styles.cancelModalInnerContainer}>

                        <View style={styles.cancelContainer}>
                            <View style={styles.cancelReasonContainer}>
                                <Text style={styles.cancelReasonText}>{t('cancel_reason_modal_title')}</Text>
                            </View>

                            <View style={styles.radioContainer}>
                                <RadioForm
                                    radio_props={cancelReasons}
                                    initial={0}
                                    animation={false}
                                    buttonColor={colors.RADIO_BUTTON}
                                    selectedButtonColor={colors.RADIO_BUTTON_SELECTION}
                                    buttonSize={10}
                                    buttonOuterSize={20}
                                    style={styles.radioContainerStyle}
                                    labelStyle={styles.radioText}
                                    radioStyle={[styles.radioStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                    onPress={(value) => { setCancelReasonSelected(value) }}
                                />
                            </View>
                            <View style={[styles.cancelModalButtosContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Button
                                    title={t('dont_cancel_text')}
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => { setModalVisible(false) }}
                                    buttonStyle={styles.cancelModalButttonStyle}
                                    containerStyle={styles.cancelModalButtonContainerStyle}
                                />

                                <View style={styles.buttonSeparataor} />

                                <Button
                                    title={t('no_driver_found_alert_OK_button')}
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => {
                                        if (cancelReasonSelected >= 0) {
                                            dispatch(cancelBooking({ booking: curBooking, reason: cancelReasons[cancelReasonSelected].label, cancelledBy: role }));
                                        } else {
                                            Alert.alert(t('alert'), t('select_reason'));
                                        }
                                    }}
                                    buttonStyle={styles.cancelModalButttonStyle}
                                    containerStyle={styles.cancelModalButtonContainerStyle}
                                />
                            </View>

                        </View>


                    </View>
                </View>

            </Modal>
        )
    }


    const searchModal = () => {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={searchModalVisible}
                onRequestClose={() => {
                    setSearchModalVisible(false)
                }}
            >
               <View style={{ flex: 1, backgroundColor: colors.BACKGROUND, justifyContent: 'center', alignItems: 'center' }}>
                    {curBooking && curBooking.driverOffers && !curBooking.selectedBid?
                    <View style={{ width: width - 40, backgroundColor: colors.WHITE, borderRadius: 10, flex: 1, maxHeight: height - 200,marginTop:15 }}>
                        <View style={{ color: colors.BLACK, position:'absolute', top:20, alignSelf:'center' }}>
                            <Text style={{ color: colors.BLACK, fontSize: 20 }}>{t('drivers')}</Text>
                        </View>
                        <View style={{marginTop: 60,width: width - 60, height: height - 340, marginRight:10,marginLeft:10, alignSelf:'center',maxWidth:350,}}>
                            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1}}>
                                {Object.keys(curBooking.driverOffers).map(key=>  
                                    <View key={key} style={styles.vew}>
                                        <View style={{height:'70%',width:'100%',flexDirection:isRTL?'row-reverse':'row'}}>
                                            <View style={{width:'25%',justifyContent:'center',alignItems:'center'}}>
                                            <Image source={curBooking && curBooking.driverOffers[key].driver_image ? { uri: curBooking.driverOffers[key].driver_image} : require('../../assets/images/profilePic.png')} style={{ borderRadius: 30, width: 65, height: 65 }} />
                                            </View>
                                            <View style={{width:'75%',alignItems:'center'}}>
                                                <Text style={{ color: colors.BLACK, fontSize: 16,marginTop:4,textAlign:'center',}}>{curBooking.driverOffers[key].driver_name}</Text>
                                                <StarRating
                                                    maxStars={5}
                                                    starSize={20}
                                                    enableHalfStar={true}
                                                    color={colors.STAR}
                                                    emptyColor={colors.STAR}
                                                    rating={curBooking && curBooking.driverOffers[key] && curBooking.driverOffers[key].driverRating ? parseFloat(curBooking.driverOffers[key].driverRating) : 0}
                                                    onChange={()=>{
                                                        //console.log('hello')
                                                    }}
                                                    style={[isRTL ? {transform: [{ scaleX:-1}] } : null]}
                                                />
                                                <View style={{flexDirection:isRTL?'row-reverse':'row',width:'100%',justifyContent:'center',alignItems:'center',marginTop:4}}>
                                                    <Text style={{ color: colors.BLACK, fontSize: 22, fontWeight: '700',}}>{settings.symbol} {parseFloat(curBooking.driverOffers[key].trip_cost).toFixed(2)}</Text>
                                                        <Button
                                                            title={t('accept')}
                                                            titleStyle={styles.buttonTitleText}
                                                            onPress={() => acceptBid(curBooking.driverOffers[key])}
                                                            buttonStyle={styles.accpt}
                                                        />
                                                </View>
                                                <Text style={{ color: colors.BLACK, fontSize: 16,fontWeight: '600',alignSelf:'center'}}>{moment(curBooking.driverOffers[key].deliveryDate).format('lll')}</Text>
                                        <View style={{flexDirection:isRTL?'row-reverse':'row',alignSelf:'center'}}>
                                        <Text style={{ color: colors.BLACK, fontSize: 12,marginTop:3}}>{t('driver_distance')} - </Text>
                                        <Text style={{ color: colors.BLACK, fontSize: 16, fontWeight: '600', }}>{curBooking && curBooking.driverEstimates && curBooking.driverEstimates[key].timein_text ? curBooking.driverEstimates[key].timein_text : t('within_min')}</Text>
                                        </View>
                                            </View>
                                            
                                        </View>
                                       
                                    </View>
                                )}
                            </ScrollView>
                        </View> 
                        <View style={{position:'absolute', bottom:20,  alignSelf:'center'}}>
                            <Button
                                title={t('close')}
                                loading={false}
                                loadingProps={{ size: "large", }}
                                titleStyle={styles.buttonTitleText}
                                onPress={() => { setSearchModalVisible(false) }}
                                buttonStyle={{width:100}}
                                containerStyle={{ marginTop: 20 }}
                            />
                        </View>
                    </View>
                    :
                    <View style={{ width: width -70, borderRadius: 10, flex: 1, maxHeight: 310,marginTop:15,backgroundColor:colors.WHITE}}>
                        <Image source={require('../../assets/images/g4.gif')} resizeMode={'contain'} style={{ width: '100%', height: 220,alignSelf:'center'}} />
                        <View style={{ color: colors.BLACK, alignSelf:'center' }}>
                            <Text style={{ color: colors.HEADER, fontSize: 16,}}>{t('driver_assign_messege')}</Text>
                        </View>
                        <View style={{position:'absolute', bottom:20,  alignSelf:'center'}}>
                            <Button
                                title={t('close')}
                                loading={false}
                                loadingProps={{ size: "large", }}
                                titleStyle={styles.buttonTitleText}
                                onPress={() => { setSearchModalVisible(false) }}
                                buttonStyle={{ width: 100 }}
                                containerStyle={{ marginTop: 20 }}
                            />
                        </View>
                    </View>
                    }
                </View>
            </Modal>
        );
    }

    const chat = () => {
        props.navigation.navigate("onlineChat", { bookingId: bookingId })
    }

    const onPressCall = (phoneNumber) => {
        let call_link = Platform.OS == 'android' ? 'tel:' + phoneNumber : 'telprompt:' + phoneNumber;
        Linking.openURL(call_link);
    }

    const _pickImage = async (res) => {
        var pickFrom = res;

        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status == 'granted') {
            let result = await pickFrom({
                allowsEditing: true,
                aspect: [3, 3]
            });

            if (!result.canceled) {
                const blob = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        resolve(xhr.response);
                    };
                    xhr.onerror = function () {
                        Alert.alert(t('alert'), t('image_upload_error'));
                        setLoader(false);
                    };
                    xhr.responseType = 'blob';
                    xhr.open('GET', result.assets[0].uri, true);
                    xhr.send(null);
                });
                if (blob) {
                    setLoading(true);
                    dispatch(updateBookingImage(curBooking,
                        curBooking.status == 'ACCEPTED' || curBooking.status == 'ARRIVED' ? 'pickup_image' : 'deliver_image',
                        blob));
                }
            }
        }
    };

    const PurchaseInfoModal = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={purchaseInfoModalStatus}
                onRequestClose={() => {
                    setPurchaseInfoModalStatus(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={{ width: '100%' }}>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading}>{t('parcel_type')}</Text>
                                <Text style={styles.textContent}>
                                    {curBooking && curBooking.parcelTypeSelected ? curBooking.parcelTypeSelected.description : ''}
                                </Text>
                            </View>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading}>{t('options')}</Text>
                                <Text style={styles.textContent}>
                                    {curBooking && curBooking.optionSelected ? curBooking.optionSelected.description : ''}
                                </Text>
                            </View>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading}>{t('deliveryPerson')}</Text>
                                <Text style={styles.textContent}>
                                    {curBooking ? curBooking.deliveryPerson : ''}
                                </Text>
                            </View>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading}>{t('deliveryPersonPhone')}</Text>
                                <Text style={styles.textContent}>
                                    {curBooking ? curBooking.deliveryPersonPhone : ''}
                                </Text>
                            </View>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading}>{t('pickUpInstructions')}</Text>
                                <Text style={styles.textContent}>
                                    {curBooking ? curBooking.pickUpInstructions : ''}
                                </Text>
                            </View>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading}>{t('deliveryInstructions')}</Text>
                                <Text style={styles.textContent}>
                                    {curBooking ? curBooking.deliveryInstructions : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignSelf: 'center', height: 40 }}>
                            <OldTouch
                                loading={false}
                                onPress={() => setPurchaseInfoModalStatus(false)}
                                style={styles.modalButtonStyle}
                            >
                                <Text style={styles.modalButtonTextStyle}>{t('ok')}</Text>
                            </OldTouch>
                        </View>
                    </View>
                </View>
            </Modal>

        )
    }




    const UserInfoModal = () => {
        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={userInfoModalStatus}
                onRequestClose={() => {
                    setUserInfoModalStatus(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <View style={{ width: '100%' }}>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading1}>{t('deliveryPersonPhone')}</Text>
                                <Text style={styles.textContent1} onPress={() => onPressCall(curBooking.deliveryPersonPhone)}>
                                    <Icon
                                        name="ios-call"
                                        type="ionicon"
                                        size={15}
                                        color={colors.INDICATOR_BLUE}
                                    />
                                    {curBooking ? curBooking.deliveryPersonPhone : ''}
                                </Text>
                            </View>
                            <View style={[styles.textContainerStyle, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                                <Text style={styles.textHeading1}>{t('senderPersonPhone')}</Text>

                                <Text style={styles.textContent1} onPress={() => onPressCall(curBooking.customer_contact)}>
                                    <Icon
                                        name="ios-call"
                                        type="ionicon"
                                        size={15}
                                        color={colors.INDICATOR_BLUE}
                                    />
                                    {curBooking ? curBooking.customer_contact : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignSelf: 'center', height: 40 }}>
                            <OldTouch
                                loading={false}
                                onPress={() => setUserInfoModalStatus(false)}
                                style={styles.modalButtonStyle}
                            >
                                <Text style={styles.modalButtonTextStyle}>{t('ok')}</Text>
                            </OldTouch>
                        </View>
                    </View>
                </View>
            </Modal>

        )
    }

    const onShare = async (curBooking) => {
        try {
            const result = await Share.share({
                message: curBooking.otp + t('otp_sms')
            });
        } catch (error) {
            alert(error.message);
        }
    };

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('focus', () => {
            pageActive.current = true;
        });
        return unsubscribe;
    }, [props.navigation, pageActive.current]);

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('blur', () => {
            pageActive.current = false;
            if (role == 'customer') {
                dispatch(stopLocationFetch(bookingId));
            }
        });
        return unsubscribe;
    }, [props.navigation, pageActive.current]);

    useEffect(() => {
        pageActive.current = true;
        return () => {
            pageActive.current = false;
        };
    }, []);
   
    return (
        <View style={styles.mainContainer}>
            <View style={styles.mapcontainer}>
                {curBooking?
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: curBooking.pickup.lat,
                            longitude: curBooking.pickup.lng,
                            latitudeDelta: latitudeDelta,
                            longitudeDelta: longitudeDelta
                        }}
                        minZoomLevel={13}
                    >

                        {(curBooking.status == 'ACCEPTED' || curBooking.status == 'ARRIVED' || curBooking.status == 'STARTED') && lastLocation ?
                            <Marker.Animated
                                coordinate={new AnimatedRegion({
                                    latitude: lastLocation.lat,
                                    longitude: lastLocation.lng,
                                    latitudeDelta: latitudeDelta,
                                    longitudeDelta: longitudeDelta
                                })}
                            >
                                <Image
                                    source={carImageIcon}
                                    style={{ height: 40, width: 40 }}
                                />
                            </Marker.Animated>
                            : null}

                        <Marker
                            coordinate={{ latitude: (curBooking.pickup.lat), longitude: (curBooking.pickup.lng) }}
                            title={curBooking.pickup.add}
                            pinColor={colors.GREEN_DOT}
                        />
                        <Marker
                            coordinate={{ latitude: (curBooking.drop.lat), longitude: (curBooking.drop.lng) }}
                            title={curBooking.drop.add}
                        />

                        {liveRouteCoords && (curBooking.status == 'ACCEPTED' || curBooking.status == 'STARTED') ?
                            <Polyline
                                coordinates={liveRouteCoords}
                                strokeWidth={5}
                                strokeColor={colors.INDICATOR_BLUE}
                            />
                            : null}

                        {(curBooking.status == 'ARRIVED' || curBooking.status == 'REACHED') && curBooking.coords ?
                            <Polyline
                                coordinates={curBooking.coords}
                                strokeWidth={4}
                                strokeColor={colors.INDICATOR_BLUE}
                            />
                            : null}
                    </MapView>
                    : null}
                <View style={[styles.menuIcon, isRTL ? { right: 15 } : { left: 15 }]}>
                    <TouchableOpacity onPress={() => { goBack() }} style={styles.menuIconButton} >
                        <Icon
                            name={isRTL?'arrow-right':'arrow-left'}
                            type='font-awesome'
                            color='#517fa4'
                            size={26}
                        />
                    </TouchableOpacity>
                </View>
                <View style={[isRTL ? styles.topTitle1 : styles.topTitle, { height: settings && settings.otp_secure ? 55 : 45 }]}>
                    <Text style={styles.cabText}>{t('booking_status')}: <Text style={styles.cabBoldText}>{curBooking && curBooking.status ? t(curBooking.status) : null} </Text></Text>
                    {curBooking && curBooking.status == 'ACCEPTED' ?
                        <Text style={styles.cabText}>{curBooking && curBooking.status == 'ACCEPTED' && settings.showLiveRoute ? '( ' + arrivalTime + ' ' + t('mins') + ' )' : ''}</Text>
                        : null}
                    {role == 'customer' && settings.otp_secure ?
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', padding: 1,alignSelf:'center'}}>
                            <Text style={styles.otpText}>{curBooking ? t('otp') + curBooking.otp : null}</Text>
                            <View>
                                <TouchableOpacity onPress={() => onShare(curBooking)}>
                                    <Icon
                                        name="share-social-outline"
                                        type="ionicon"
                                        size={22}
                                        color={colors.INDICATOR_BLUE} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        : null}
                </View>
                {role == 'driver' && appConsts.showBookingOptions ?
                    <TouchableOpacity
                        style={[styles.floatButton, isRTL ? { left: 10, bottom: 220 } : { right: 10, bottom: 220 }]}

                        onPress={() => setPurchaseInfoModalStatus(true)}
                    >
                        <Icon
                            name="cube"
                            type="ionicon"
                            size={30}
                            color={colors.WHITE}
                        />
                    </TouchableOpacity>
                    : null}
                {role == 'driver' ?
                    <TouchableOpacity
                        style={[styles.floatButton, isRTL ? { left: 10, bottom: 150 } : { right: 10, bottom: 150 }]}
                        onPress={() =>
                            startNavigation()
                        }
                    >
                        <Icon
                            name="ios-navigate"
                            type="ionicon"
                            size={30}
                            color={colors.WHITE}
                        />
                    </TouchableOpacity>
                    : null}
                {curBooking && !(curBooking.status == 'NEW') ?
                    <TouchableOpacity
                        style={[styles.floatButton, isRTL ? { left: 10, bottom: 80 } : { right: 10, bottom: 80 }]}
                        onPress={() => chat()}
                    >
                        <Icon
                            name="ios-chatbubbles"
                            type="ionicon"
                            size={30}
                            color={colors.WHITE}
                        />
                    </TouchableOpacity>
                    : null}
                {curBooking && !(curBooking.status == 'NEW') ?
                    <TouchableOpacity
                        style={[styles.floatButton, isRTL ? { left: 10, bottom: 10 } : { right: 10, bottom: 10 }]}
                        onPress={() => role == 'customer' ? onPressCall(curBooking.driver_contact) : (appConsts.canCall ? onPressCall(curBooking.customer_contact) : setUserInfoModalStatus(true))}
                    >
                        <Icon
                            name="ios-call"
                            type="ionicon"
                            size={30}
                            color={colors.WHITE}
                        />
                    </TouchableOpacity>
                    : null}
            </View>
            <View style={[styles.addressBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.ballandsquare}>
                    <View style={styles.hbox1} /><View style={styles.hbox2} /><View style={styles.hbox3} />
                </View>
                <View style={[styles.contentStyle, isRTL ? { paddingRight: 10 } : { paddingLeft: 10 }]}>
                    <TouchableOpacity style={styles.addressStyle1}>
                        <Text numberOfLines={1} style={[styles.textStyle, { flexDirection: isRTL ? "row-reverse" : "row" }]}>{curBooking ? curBooking.pickup.add : ""}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addressStyle2}>
                        <Text numberOfLines={1} style={[styles.textStyle, { flexDirection: isRTL ? "row-reverse" : "row" }]}>{curBooking ? curBooking.drop.add : ""}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[styles.bottomContainer, { height: (curBooking && curBooking.status && (curBooking.status == "NEW" || curBooking.status == "ARRIVED" || curBooking.status == "ACCEPTED")) ? 150 : 120 }]}>
                <View style={styles.cabDetailsContainer}>
                    {curBooking && curBooking.status == "NEW" && (curBooking.bookLater == false || (curBooking.bookLater && (((new Date(curBooking.tripdate)) - (new Date())) / (1000 * 60)) <= 15))?
                        <View style={{ flex: 1, width: width, height: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Image style={{ width: 40, height: 40 }} source={require('../../assets/images/loader.gif')} />
                            <TouchableOpacity onPress={()=>{ setSearchModalVisible(!searchModalVisible) }}>
                                <Text style={{ fontSize: 22 }}>{curBooking.driverOffers? t('selectBid'): t('searching')}</Text>
                            </TouchableOpacity>
                        </View>
                        : null}
                    {curBooking && curBooking.status == "NEW" && curBooking.bookLater && (((new Date(curBooking.tripdate)) - (new Date())) / (1000 * 60)) > 15 ?
                        <View style={{ flex: 1, width: width, height: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16 }}>{t('trip_start_time') + ":  "}</Text>
                            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{moment(curBooking.tripdate).format('lll')}</Text>
                        </View>
                        : null}

                    {curBooking && curBooking.status != "NEW" ?
                        <View style={styles.cabDetails}>
                            <View style={styles.cabName}>
                                <Text style={styles.cabNameText}>{curBooking.carType}</Text>
                            </View>

                            <View style={styles.cabPhoto}>
                                <Image source={{ uri: curBooking.carImage }} resizeMode={'contain'} style={styles.cabImage} />
                            </View>

                            <View style={styles.cabNumber}>
                                <Text style={styles.cabNumberText}>{curBooking.vehicle_number}</Text>
                            </View>

                        </View>
                        : null}
                    {curBooking && curBooking.status != "NEW" ?
                        <View style={styles.verticalDesign}>
                            <View style={styles.triangle} />
                            <View style={styles.verticalLine} />
                        </View>
                        : null}
                    {curBooking && curBooking.status != "NEW" ?
                        <View style={styles.driverDetails}>
                            {role == 'customer' ?
                                <View style={styles.driverPhotoContainer}>
                                    <Image source={curBooking.driver_image ? { uri: curBooking.driver_image } : require('../../assets/images/profilePic.png')} style={styles.driverPhoto} />
                                    <Text style={styles.driverNameText}>{curBooking.driver_name}</Text>
                                </View>
                                :
                                <View style={styles.driverPhotoContainer}>
                                    <Image source={curBooking.customer_image ? { uri: curBooking.customer_image } : require('../../assets/images/profilePic.png')} style={styles.driverPhoto} />
                                    <Text style={styles.driverNameText}>{curBooking.customer_name}</Text>
                                </View>
                            }
                            <View style={styles.ratingContainer}>
                                {role == 'customer' ?
                                    <StarRating
                                        maxStars={5}
                                        starSize={height / 42}
                                        enableHalfStar={true}
                                        color={colors.STAR}
                                        emptyColor={colors.STAR}
                                        rating={parseFloat(curBooking.driverRating)}
                                        style={[styles.ratingContainerStyle,isRTL ? { marginRight: 0, transform: [{ scaleX:-1}] } : { marginLeft: -5}]}
                                        onChange={()=>{
                                            //console.log('hello')
                                        }}
                                    />
                                    : null}
                            </View>

                        </View>
                        : null}
                </View>
                {
                    renderButtons()
                }
            </View>
            {
                PurchaseInfoModal()
            }
            {
                UserInfoModal()
            }
            {
                cancelModal()
            }
            {
                alertModal()
            }
            {
                searchModal()
            }
            <OtpModal
                modalvisable={otpModalVisible}
                requestmodalclose={() => { setOtpModalVisible(false) }}
                otp={curBooking ? curBooking.otp : ''}
                onMatch={(value) => value ? appConsts.hasStartOtp? startBooking() : endBooking() : null}
            />
        </View>
    );

}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: colors.WHITE, },
    headerStyle: {
        backgroundColor: colors.HEADER,
        borderBottomWidth: 0,
    },
    headerInnerStyle: {
        marginLeft: 10,
        marginRight: 10
    },
    accpt:{
        width:90,
        backgroundColor: colors.BALANCE_GREEN,
        height:48,
        borderRadius:10,
        marginLeft:10
    },
    vew:{
        height:150,
        marginBottom: 20,
        borderColor: 'black',
        borderRadius: 10,
        backgroundColor:colors.WHITE,
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        borderWidth:1
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 20
    },
    topContainer: { flex: 1.5, borderTopWidth: 0, alignItems: 'center', backgroundColor: colors.HEADER, paddingEnd: 20 },
    topLeftContainer: {
        flex: 1.5,
        alignItems: 'center'
    },
    topRightContainer: {
        flex: 9.5,
        justifyContent: 'space-between',
    },
    circle: {
        height: 15,
        width: 15,
        borderRadius: 15 / 2,
        backgroundColor: colors.LIGHT_YELLOW
    },
    staightLine: {
        height: height / 25,
        width: 1,
        backgroundColor: colors.LIGHT_YELLOW
    },
    square: {
        height: 17,
        width: 17,
        backgroundColor: colors.MAP_SQUARE
    },
    whereButton: { flex: 1, justifyContent: 'center', borderBottomColor: colors.WHITE, borderBottomWidth: 1 },
    whereContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    whereText: { flex: 9, fontFamily: 'Roboto-Regular', fontSize: 14, fontWeight: '400', color: colors.WHITE },
    iconContainer: { flex: 1, },
    dropButton: { flex: 1, justifyContent: 'center' },
    mapcontainer: {
        flex: 7,
        width: width
    },
    bottomContainer: { alignItems: 'center' },
    map: {
        flex: 1,
        minHeight: 400,
        ...StyleSheet.absoluteFillObject,
    },
    otpContainer: { flex: 0.8, backgroundColor: colors.BOX_BG, width: width, flexDirection: 'row', justifyContent: 'space-between' },
    cabText: { paddingLeft: 10, alignSelf: 'center', color: colors.BLACK, fontFamily: 'Roboto-Regular' },
    cabBoldText: { fontFamily: 'Roboto-Bold' },
    otpText: { color: colors.BLACK, fontFamily: 'Roboto-Bold', },
    cabDetailsContainer: { flex: 2.5, backgroundColor: colors.WHITE, flexDirection: 'row', position: 'relative', zIndex: 1 },
    cabDetails: { flex: 19 },
    cabName: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    cabNameText: { color: colors.MAP_TEXT, fontFamily: 'Roboto-Bold', fontSize: 13 },
    cabPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabImage: { width: 100, height: height / 20, marginBottom: 5, marginTop: 5 },
    cabNumber: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabNumberText: { color: colors.BUTTON, fontFamily: 'Roboto-Bold', fontSize: 13 },
    verticalDesign: { flex: 2, height: 50, width: 1, alignItems: 'center' },
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
        ],

        marginTop: -1,
        overflow: 'visible'
    },
    verticalLine: { height: height / 18, width: 0.5, backgroundColor: colors.BLACK, alignItems: 'center', marginTop: 10 },
    driverDetails: { flex: 19, alignItems: 'center', justifyContent: 'center', },
    driverPhotoContainer: { alignItems: 'center', marginTop: 10 },
    driverPhoto: { borderRadius: height / 20 / 2, width: height / 20, height: height / 20, },
    driverNameContainer: { flex: 2.2, alignItems: 'center', justifyContent: 'center' },
    driverNameText: { color: '#4f4e4e', fontFamily: 'Roboto-Bold', fontSize: 14 },
    ratingContainer: { flex: 2.4, alignItems: 'center', justifyContent: 'center' },
    ratingContainerStyle: { paddingBottom: Platform.OS == 'android' ? 0 : 0 },

    alertModalContainer: { flex: 1, justifyContent: 'center', backgroundColor: colors.BACKGROUND },
    alertModalInnerContainer: { height: 200, width: (width * 0.85), backgroundColor: colors.WHITE, alignItems: 'center', alignSelf: 'center', borderRadius: 7 },
    alertContainer: { flex: 2, justifyContent: 'space-between', width: (width - 100) },
    rideCancelText: { flex: 1, top: 15, color: colors.BLACK, fontFamily: 'Roboto-Bold', fontSize: 20, alignSelf: 'center' },
    horizontalLLine: { width: (width - 110), height: 0.5, backgroundColor: colors.BLACK, alignSelf: 'center', },
    msgContainer: { flex: 2.5, alignItems: 'center', justifyContent: 'center' },
    cancelMsgText: { color: colors.BLACK, fontFamily: 'Roboto-Regular', fontSize: 15, alignSelf: 'center', textAlign: 'center' },
    okButtonContainer: { flex: 1, width: (width * 0.85), flexDirection: 'row', backgroundColor: colors.BUTTON, alignSelf: 'center' },
    okButtonStyle: { flexDirection: 'row', backgroundColor: colors.BUTTON, alignItems: 'center', justifyContent: 'center' },
    okButtonContainerStyle: { flex: 1, width: (width * 0.85), backgroundColor: colors.BUTTON, },
   
    cancelModalContainer: { flex: 1, justifyContent: 'center', backgroundColor: colors.BACKGROUND },
    cancelModalInnerContainer: { height: 400, width: width * 0.85, padding: 0, backgroundColor: colors.WHITE, alignItems: 'center', alignSelf: 'center', borderRadius: 7 },
    cancelContainer: { flex: 1, justifyContent: 'space-between', width: (width * 0.85) },
    cancelReasonContainer: { flex: 1 },
    cancelReasonText: { top: 10, color: colors.BLACK, fontFamily: 'Roboto-Bold', fontSize: 20, alignSelf: 'center' },
    radioContainer: { flex: 8, alignItems: 'center' },
    radioText: { fontSize: 16, fontFamily: 'Roboto-Medium', color: colors.BLACK, },
    radioContainerStyle: { paddingTop: 30, marginLeft: 10 },
    radioStyle: { paddingBottom: 25 },
    cancelModalButtosContainer: { flex: 1, backgroundColor: colors.BUTTON, alignItems: 'center', justifyContent: 'center' },
    buttonSeparataor: { height: height / 35, width: 0.8, backgroundColor: colors.WHITE, alignItems: 'center', marginTop: 3 },
    cancelModalButttonStyle: { backgroundColor: colors.BUTTON, borderRadius: 0 },
    cancelModalButtonContainerStyle: { flex: 1, width: (width * 2) / 2, backgroundColor: colors.BUTTON, alignSelf: 'center', margin: 0 },
    signInTextStyle: {
        fontFamily: 'Roboto-Bold',
        fontWeight: "700",
        color: colors.WHITE
    },
    floatButton: {
        borderWidth: 1,
        borderColor: colors.BLACK,
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        position: "absolute",
        right: 10,
        height: 60,
        backgroundColor: colors.BLACK,
        borderRadius: 30
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: colors.BACKGROUND
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "flex-start",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    textContainerStyle: {
        flexDirection: 'column',
        marginBottom: 12,
    },
    textHeading: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textHeading1: {
        fontSize: 20,
        color: colors.BLACK
    },
    textContent: {
        fontSize: 14,
        margin: 4,
    },
    textContent1: {
        fontSize: 20,
        color: colors.BUTTON_LOADING,
        padding: 5
    },
    modalButtonStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.BUTTON_RIGHT,
        width: 100,
        height: 40,
        elevation: 0,
        borderRadius: 10
    },
    modalButtonTextStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
        fontSize: 18
    },
    topTitle: {
        width: 188,
        backgroundColor: colors.WHITE,
        shadowColor: colors.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3,
        borderTopLeftRadius: 30,
        borderBottomLeftRadius: 30,
        justifyContent: 'center',
        position: 'absolute',
        right: 0,
        top: hasNotch ? 40 : 40
    },
    topTitle1: {
        width: 188,
        backgroundColor: colors.WHITE,
        shadowColor: colors.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3,
        borderTopRightRadius: 30,
        borderBottomRightRadius: 30,
        justifyContent: 'center',
        position: 'absolute',
        left: 0,
        top: hasNotch ? 40 : 40
    },
    topContainer: {
        flex: 1.5,
        borderTopWidth: 0,
        alignItems: 'center',
        backgroundColor: colors.HEADER,
        paddingEnd: 20
    },
    addressBar: {
        borderBottomWidth: 0.7,
        bottom: 0,
        height: 90,
        width: '100%',
        flexDirection: 'row',
        backgroundColor: colors.WHITE,
        paddingLeft: 8,
        paddingRight: 8,
        shadowColor: colors.BLACK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3,
    },
    ballandsquare: {
        width: 12,
        alignItems: 'center',
        justifyContent: 'center',
        left: 5
    },
    hbox1: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: colors.GREEN_DOT
    },
    hbox2: {
        height: 36,
        width: 1,
        backgroundColor: colors.MAP_TEXT
    },
    hbox3: {
        height: 12,
        width: 12,
        backgroundColor: colors.DULL_RED
    },
    contentStyle: {
        justifyContent: 'center',
        width: '95%',
        height: 90,
        left: 7
    },
    addressStyle1: {
        borderBottomWidth: 1,
        height: 45,
        justifyContent: 'center',
        paddingTop: 2
    },
    addressStyle2: {
        height: 45,
        justifyContent: 'center',
    },
    textStyle: {
        fontFamily: 'Roboto-Regular',
        fontSize: 16,
        color: '#000'
    },
    menuIcon: {
        height: 40,
        width: 40,
        borderRadius: 25,
        backgroundColor: colors.WHITE,
        shadowColor: 'black',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        position: 'absolute',
        top: hasNotch ? 40 : 40,
    },
    menuIconButton: {
        flex: 1,
        height: 50,
        width: 50,
        justifyContent: 'center',
    },
});