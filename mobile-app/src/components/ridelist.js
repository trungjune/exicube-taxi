import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '../common/theme';
import i18n from 'i18n-js';
import { useSelector } from 'react-redux';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import moment from 'moment/min/moment-with-locales';
import { Ionicons, Feather, Entypo } from '@expo/vector-icons';
import { MAIN_COLOR } from '../common/sharedFunctions';

export default function RideList(props) {
    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const settings = useSelector(state => state.settingsdata.settings);
    const [tabIndex, setTabIndex] = useState(props.tabIndex);

    const onPressButton = (item, index) => {
        props.onPressButton(item, index)
    }

    const renderData = ({ item, index }) => {
        return (
            <View style={styles.iconClickStyle}>
                <TouchableOpacity onPress={() => onPressButton(item, index)}>
                    <View style={[styles.vew, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.iconViewStyle}>
                            <Entypo name="pin" size={28} color="black" />
                        </View>
                        <View style={{ width: '90%', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center' }}>
                            <View>
                                <Text style={[styles.textStyle, styles.dateStyle, { textAlign: isRTL ? "right" : "left" }]}>{item.tripdate ? moment(item.tripdate).format('lll') : ''}</Text>
                                <View style={[isRTL ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }]}>
                                    <Text style={[styles.textStyle, styles.carNoStyle, { textAlign: isRTL ? "right" : "left" }]}> {isRTL ? '-' : null} {item.carType ? item.carType : null} {isRTL ? null : '- '}</Text>
                                    <Text style={[styles.textStyle, styles.carNoStyle, { textAlign: isRTL ? "right" : "left" }]}>{item.vehicle_number ? item.vehicle_number : t('no_car_assign_text')}</Text>
                                </View>
                            </View>



                            <View style={{height: 60,justifyContent:'center',width:100,alignItems:'center'}}>
                            {item.status == 'NEW' || item.status == 'PAYMENT_PENDING' ?
                                <Text style={[styles.dateStyle,{marginTop:10}]}>{t(item.status)}</Text>
                                : null}
                                {settings.swipe_symbol === false ?
                                    <Text style={styles.dateStyle}>{item.status == 'PAID' || item.status == 'COMPLETE' ? item.customer_paid ? settings.symbol + parseFloat(item.customer_paid).toFixed(settings.decimal) : settings.symbol + parseFloat(item.estimate).toFixed(settings.decimal) : null}</Text>
                                    :
                                    <Text style={styles.dateStyle}>{item.status == 'PAID' || item.status == 'COMPLETE' ? item.customer_paid ? parseFloat(item.customer_paid).toFixed(settings.decimal) + settings.symbol : parseFloat(item.estimate).toFixed(settings.decimal) + settings.symbol : null}</Text>
                                }
                                {
                                    item.status == 'CANCELLED' ?
                                        <Image
                                            style={[styles.cancelImageStyle, isRTL ? { marginLeft: 20, alignSelf: 'flex-start' } : { marginRight: 20, alignSelf: 'flex-end', }]}
                                            source={require('../../assets/images/cancel.png')}
                                        />
                                        :
                                        null
                                }
                            </View>
                        </View>
                    </View>
                    <View style={{ padding: 20 }}>
                        <View style={[styles.position, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Ionicons name="md-location-outline" size={26} color={colors.RIDELIST_TEXT} />
                            <Text style={styles.picPlaceStyle}>{item.pickup ? item.pickup.add : t('not_found_text')}</Text>
                        </View>
                        <View style={[styles.position, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Feather name="flag" size={26} color={colors.RIDELIST_TEXT} />
                            <Text style={styles.picPlaceStyle}>{item.drop ? item.drop.add : t('not_found_text')}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

        )
    }
    return (
        <View style={styles.textView3}>
            <View style={{ backgroundColor: MAIN_COLOR}}>
                <SegmentedControlTab
                    values={[t('active_booking'), t('COMPLETE'), t('CANCELLED')]}
                    selectedIndex={tabIndex}
                    onTabPress={(index) => setTabIndex(index)}
                    borderRadius={0}
                    tabsContainerStyle={[styles.segmentcontrol,{flexDirection:isRTL?'row-reverse':'row'}]}
                    tabStyle={{
                        borderWidth: 0,
                        backgroundColor: 'transparent',
                    }}
                    activeTabStyle={{ borderBottomColor: colors.WHITE, backgroundColor: 'transparent', borderBottomWidth: 2 }}
                    tabTextStyle={{ color: colors.RIDELIST_TEXT, fontWeight: 'bold', }}
                    activeTabTextStyle={{ color: colors.WHITE }}
                />
                <View style={{ height: '100%' }}>
                    <View style={{ height: '10%' }}>

                    </View>
                    <View style={{ height: '90%', backgroundColor: colors.WHITE, width: '100%', borderTopRightRadius: 20, borderTopLeftRadius: 20, }}>
                        <View style={{ marginTop: -50,flex:1,marginBottom:100}}>
                            <FlatList
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={true}
                                keyExtractor={(item, index) => index.toString()}
                                data={tabIndex === 0 ? props.data.filter(item => !(item.status === 'CANCELLED' || item.status === 'COMPLETE')) : (tabIndex === 1 ? props.data.filter(item => item.status === 'COMPLETE') : props.data.filter(item => item.status === 'CANCELLED'))}
                                renderItem={renderData}
                            />
                        </View>
                    </View>
                </View>

            </View>

        </View>
    );

};

const styles = StyleSheet.create({
    textStyle: {
        fontSize: 18,
    },
    vew: {
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2,
        elevation: 2,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        backgroundColor: colors.new, 
        height: 60
    },
    iconClickStyle: {
        flex: 1,
        width: '95%',
        alignSelf: 'center',
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2,
        elevation: 2,
        borderRadius: 15, backgroundColor: colors.WHITE,
        marginVertical: 10,
    },
    picPlaceStyle: {
        color: colors.HEADER,
        marginHorizontal: 15
    },
    dateStyle: {
        fontFamily: 'Roboto-Bold',
        color: colors.HEADER,
        fontSize:18
    },
    carNoStyle: {
        fontFamily: 'Roboto-Regular',
        fontSize: 14,
        marginTop: 8,
        color: colors.HEADER,
    },
    placeStyle: {
        fontFamily: 'Roboto-Regular',
        fontSize: 16,
        alignSelf: 'center'
    },
    cancelImageStyle: {
        width: 50,
        height: 50,
        marginTop:30
    },
    iconViewStyle: {
        width: '10%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    textView3: {
        flex: 1
    },
    position: {
        alignItems: 'center',
        padding: 10

    },
    segmentcontrol: {
        color: colors.WHITE,
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        marginTop: 0,
        alignSelf: "center",
        height: 50
    }
});