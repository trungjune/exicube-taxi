import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    Modal,
    Dimensions,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { Button } from 'react-native-elements';
import StarRating from 'react-native-star-rating-widget';
import { colors } from '../common/theme';
var { width } = Dimensions.get('window');
import i18n from 'i18n-js';
import { useDispatch, useSelector } from 'react-redux';
import { api } from 'common';
import moment from 'moment/min/moment-with-locales';
import { MAIN_COLOR } from '../common/sharedFunctions';
import ZigzagView from "react-native-zigzag-view";

export default function DriverRating(props) {
    const { updateBooking } = api;
    const dispatch = useDispatch();
    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const [starCount, setStarCount] = useState(0);
    const [alertModalVisible, setAlertModalVisible] = useState(false);
    const activeBookings = useSelector(state => state.bookinglistdata.active);
    const settings = useSelector(state => state.settingsdata.settings);
    const [booking, setBooking] = useState();
    const { bookingId } = props.route.params;

    useEffect(() => {
        if (activeBookings && activeBookings.length >= 1) {
            let bookingData = activeBookings.filter(item => item.id == bookingId.id)[0];
            if (bookingData) {
                setBooking(bookingData);
            }
        }
    }, [activeBookings]);

    const onStarRatingPress = (rating) => {
        setStarCount(rating);
    }

    const skipRating = () => {
        let curBooking = { ...bookingId };
        curBooking.status = 'COMPLETE';
        dispatch(updateBooking(curBooking));
        props.navigation.navigate('TabRoot',{name:"RideList",params:{"fromBooking":true}});
    }


    const submitNow = () => {
        let curBooking = { ...booking };
        curBooking.rating = starCount;
        curBooking.status = 'COMPLETE';
        dispatch(updateBooking(curBooking));
        props.navigation.navigate('TabRoot',{name:"RideList",params:{"fromBooking":true}});
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

                            <Text style={styles.rideCancelText}>{t('no_driver_found_alert_title')}</Text>

                            <View style={styles.horizontalLLine} />

                            <View style={styles.msgContainer}>
                                <Text style={styles.cancelMsgText}>{t('thanks')}</Text>
                            </View>
                            <View style={[styles.okButtonContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <Button
                                    title={t('no_driver_found_alert_OK_button')}
                                    titleStyle={styles.signInTextStyle}
                                    onPress={() => {
                                        setAlertModalVisible(false);
                                        props.navigation.navigate('TabRoot', { screen: 'Map' });
                                    }}
                                    buttonStyle={[styles.okButtonStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                                    containerStyle={styles.okButtonContainerStyle}
                                />
                            </View>

                        </View>

                    </View>
                </View>

            </Modal>
        )
    }

    return (
        <View style={[styles.mainViewStyle, { backgroundColor: MAIN_COLOR }]}>
            <ScrollView  showsVerticalScrollIndicator={false}>
                <View style={styles.tripMainView}>
                    {booking ?
                        booking.driver_image != '' ? <Image source={{ uri: booking.driver_image }} style={{ height: 78, width: 78, borderRadius: 78 / 2 }} /> :
                            <Image source={require('../../assets/images/profilePic.png')} style={{ height: 78, width: 78, borderRadius: 78 / 2 }} />
                        : null}
                    <Text style={styles.Drivername}>{booking ? booking.driver_name : null}</Text>
                </View>
                <ZigzagView  backgroundColor="#CCC"
                  surfaceColor="#FFF" style={styles.vew}>
                    <Text style={[styles.Drivername, { textDecorationLine: 'underline' }]}>{t('receipt')}</Text>
                    <View style={styles.addressViewStyle}>
                        <View style={[styles.pickUpStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>

                            <View style={styles.greenDot}></View>
                            <Text style={[styles.addressViewTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}>{booking ? booking.pickup.add : ''}</Text>
                        </View>
                        <View style={[styles.pickUpStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={styles.redDot}></View>
                            <Text style={[styles.addressViewTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}>{booking ? booking.drop.add : ''}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', marginVertical: 10 }}>
                        <Text style={{ fontSize: 18 }}>{t('payaed_ammount')}</Text>
                        <View>
                            {settings.swipe_symbol === false ?
                                <Text style={styles.rateViewTextStyle}>{settings.symbol}{booking ? booking.customer_paid > 0 ? parseFloat(booking.customer_paid).toFixed(settings.decimal) : 0 : null}</Text>
                                :
                                <Text style={styles.rateViewTextStyle}>{booking ? booking.customer_paid > 0 ? parseFloat(booking.customer_paid).toFixed(settings.decimal) : 0 : null}{settings.symbol}</Text>
                            }
                        </View>
                    </View>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', marginBottom: 30 }}>
                        <Text style={[{ fontSize: 18 }, isRTL ? { marginRight: 18 } : { marginLeft: 18 }]}>{t('date_time')}</Text>
                        <View>
                            <Text style={styles.dateViewTextStyle}>{booking && booking.tripdate ? moment(booking.tripdate).format('lll') : null}</Text>

                        </View>
                    </View>
                 </ZigzagView>
                <View style={styles.ratingViewStyle}>
                    <StarRating
                        maxStars={5}
                        starSize={40}
                        enableHalfStar={true}
                        color={colors.WHITE}
                        emptyColor={colors.WHITE}
                        rating={starCount}
                        onChange={(rating) => onStarRatingPress(rating)}
                        style={[isRTL ? { marginRight: 0, transform: [{ scaleX:-1}] } : { scaleX:1}]}
                    />
                </View>
          
            <View style={styles.confBtnStyle}>
                <Button
                    title={t('submit_rating')}
                    titleStyle={{ fontFamily: 'Roboto-Bold' }}
                    onPress={() => submitNow()}
                    buttonStyle={styles.myButtonStyle}
                    disabled={starCount > 0 ? false : true}
                />
                <TouchableOpacity onPress={() => skipRating()}><Text style={{ color: colors.HEADER, fontSize: 18 }}>{t('skip')}</Text></TouchableOpacity>
            </View>
            </ScrollView>
            {
                alertModal()
            }
        </View >
    )
}
const styles = StyleSheet.create({

    tripMainView: {
        height: '18%',
        alignItems: 'center',
        marginTop:10
    },
    ratingViewStyle: {
        flexDirection: "row",
        alignSelf: 'center',
       marginVertical:25
    },
    Drivername: {
        color: colors.HEADER,
        fontSize: 22,
        textAlign: "center",
        fontFamily: 'Roboto-Regular',
        marginTop: 8
    },
    vew: {
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 2,
        width: '95%',
        alignSelf: 'center',
        padding: 6,
        borderRadius: 15,
        marginTop:30   
    },
    addressViewTextStyle: {
        color: colors.DRIVER_RATING_TEXT,
        fontSize: 17,
        fontFamily: 'Roboto-Regular',
        marginHorizontal: 8,
        padding: 8,
        marginTop: 8
    },
    pickUpStyle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainViewStyle: {
        height: '100%',
        width: '100%'
    },
    rateViewTextStyle: {
        fontSize: 20,
        color: colors.HEADER,
        fontFamily: 'Roboto-Bold',
        fontWeight: 'bold',
    },
    dateViewTextStyle: {
        fontFamily: 'Roboto-Regular',
        color: colors.HEADER,
        fontSize: 18,
    },
    confBtnStyle: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: 'center',
       marginVertical:20
    },
    greenDot: {
        backgroundColor: colors.GREEN_DOT,
        width: 12,
        height: 12,
        borderRadius: 50,
        margin: 5
    },
    redDot: {
        backgroundColor: colors.RED,
        width: 12,
        height: 12,
        borderRadius: 50,
        margin: 5
    },
    myButtonStyle: {
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: colors.SKY,
        width: 300,
        height: 50,
        padding: 10,
        borderRadius: 10,
        marginBottom: 15
    },
    alertModalContainer: { flex: 1, justifyContent: 'center', backgroundColor: colors.BACKGROUND },
    alertModalInnerContainer: { height: 200, width: (width * 0.85), backgroundColor: colors.WHITE, alignItems: 'center', alignSelf: 'center', borderRadius: 7 },
    alertContainer: { flex: 2, justifyContent: 'space-between', width: (width - 100) },
    rideCancelText: { flex: 1, top: 15, color: colors.BLACK, fontFamily: 'Roboto-Bold', fontSize: 20, alignSelf: 'center' },
    horizontalLLine: { width: (width - 110), height: 0.5, backgroundColor: colors.BLACK, alignSelf: 'center', },
    msgContainer: { flex: 2.5, alignItems: 'center', justifyContent: 'center' },
    cancelMsgText: { color: colors.BLACK, fontFamily: 'Roboto-Regular', fontSize: 15, alignSelf: 'center', textAlign: 'center' },
    okButtonContainer: { flex: 1, width: (width * 0.85), flexDirection: 'row', backgroundColor: colors.DRIVER_RATING_TEXT, alignSelf: 'center' },
    okButtonStyle: { flexDirection: 'row', backgroundColor: colors.DRIVER_RATING_TEXT, alignItems: 'center', justifyContent: 'center' },
    okButtonContainerStyle: { flex: 1, width: (width * 0.85), backgroundColor: colors.DRIVER_RATING_TEXT },
});