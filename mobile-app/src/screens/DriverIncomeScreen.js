import React, { useState, useEffect } from 'react';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text
} from 'react-native';
import i18n from 'i18n-js';
import { useSelector } from 'react-redux';

export default function DriverIncomeScreen(props) {

    const bookings = useSelector(state => state.bookinglistdata.bookings);
    const settings = useSelector(state => state.settingsdata.settings);
    const [totalEarning, setTotalEarning] = useState(0);
    const [today, setToday] = useState(0);
    const [thisMonth, setThisMonth] = useState(0);
    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;

    const [bookingCount, setBookingCount] = useState();

    useEffect(() => {
        if (bookings) {
            let today = new Date();
            let tdTrans = 0;
            let mnTrans = 0;
            let totTrans = 0;
            let count = 0;
            for (let i = 0; i < bookings.length; i++) {
                if (bookings[i].status === 'PAID' || bookings[i].status === 'COMPLETE') {
                    const { tripdate, driver_share } = bookings[i];
                    let tDate = new Date(tripdate);
                    if (driver_share != undefined) {
                        if (tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth()) {
                            tdTrans = tdTrans + parseFloat(driver_share);
                        }
                        if (tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear()) {
                            mnTrans = mnTrans + parseFloat(driver_share);
                        }
                        totTrans = totTrans + parseFloat(driver_share);
                        count = count + 1;
                    }
                }
            }
            setTotalEarning(totTrans.toFixed(settings.decimal));
            setToday(tdTrans.toFixed(settings.decimal));
            setThisMonth(mnTrans.toFixed(settings.decimal));
            setBookingCount(count);
        } else {
            setTotalEarning(0);
            setToday(0);
            setThisMonth(0);
            setBookingCount(0);
        }
    }, [bookings]);

    return (
        <View style={styles.mainView}>
            <View style={styles.vew}>
             
                       <Text style={styles.todayEarningHeaderText2}>{t('booking_count')}</Text>
                      <Text style={styles.todayEarningMoneyText2}>{bookingCount}</Text>
                   
                <View style={[styles.vew1, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.vew2}>
                        <Text style={styles.todayEarningHeaderText}>{t('today_text')}</Text>
                    </View>
                    <View style={styles.vew3}>
                        {settings.swipe_symbol === false ?
                            <Text style={styles.todayEarningMoneyText}>{settings.symbol}{today ? parseFloat(today).toFixed(settings.decimal) : '0'}</Text>
                            :
                            <Text style={styles.todayEarningMoneyText}>{today ? parseFloat(today).toFixed(settings.decimal) : '0'}{settings.symbol}</Text>
                        }
                    </View>
                </View>

                <View style={[styles.vew1, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.vew2}>
                        <Text style={styles.todayEarningHeaderText}>{t('thismonth')}</Text>
                    </View>
                    <View style={styles.vew3}>
                        {settings.swipe_symbol === false ?
                            <Text style={styles.todayEarningMoneyText}>{settings.symbol}{thisMonth?parseFloat(thisMonth).toFixed(settings.decimal):'0'}</Text>
                            :
                            <Text style={styles.todayEarningMoneyText}>{thisMonth?parseFloat(thisMonth).toFixed(settings.decimal):'0'}{settings.symbol}</Text>
                        }
                    </View>
                </View>


                <View style={[styles.vew1, { flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom:20 }]}>
                    <View style={styles.vew2}>
                        <Text style={styles.todayEarningHeaderText}>{t('totalearning')}</Text>
                    </View>
                    <View style={styles.vew3}>
                        {settings.swipe_symbol === false ?
                            <Text style={styles.todayEarningMoneyText}>{settings.symbol}{totalEarning?parseFloat(totalEarning).toFixed(settings.decimal):'0'}</Text>
                            :
                            <Text style={styles.todayEarningMoneyText}>{totalEarning?parseFloat(totalEarning).toFixed(settings.decimal):'0'}{settings.symbol}</Text>
                        }
                    </View>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE,
    },
    vew: {
        height: '65%',
        width: '95%',
        alignSelf: 'center',
        marginTop: 25,
        backgroundColor: colors.new,
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        justifyContent:'center',
        alignItems:'center',
        borderTopRightRadius:45,
        borderBottomLeftRadius:45

    },
    vew1: {
        height: '20%',
        width: '95%',
        borderRadius: 15,
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        backgroundColor: colors.WHITE,
        alignSelf: 'center',
        marginVertical:8
    },
    vew2: {
        height: '100%',
        width: '40%',
        justifyContent:'center',
    },
    vew3: {
        height: '100%',
        width: '60%',
        justifyContent:'center'
    },
    todayEarningHeaderText: {
        fontSize: 20,
        color: colors.BALANCE_GREEN,
        margin:15
    },
    todayEarningMoneyText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.BALANCE_GREEN,
        margin:15
    },
    todayEarningHeaderText2: {
        fontSize: 20,
        color: colors.SKY
    },
    todayEarningMoneyText2: {
        fontSize: 30,
        fontWeight: 'bold',
        color: colors.SKY,
        marginBottom:10
    },
})