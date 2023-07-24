import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, FlatList, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
import i18n from 'i18n-js';
import { useSelector } from 'react-redux';
import moment from 'moment/min/moment-with-locales';
import SegmentedControlTab from 'react-native-segmented-control-tab';
export default function  WTransactionHistory(props) {
    const [data,setData] = useState(null);
    const settings = useSelector(state => state.settingsdata.settings);
    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const [tabIndex, setTabIndex] = useState(0);

    useEffect(()=>{
        if(props.walletHistory && props.walletHistory.length>0){
            setData(props.walletHistory);
        } else{
            setData([]);
        }
    },[props.walletHistory]);

    useEffect(()=>{
        if(data && data.length > 0){
            const lastStatus = data[0].type;
            if(lastStatus == 'Debit') setTabIndex(1);
            if(lastStatus == 'Withdraw') setTabIndex(2);
        }else{
            setTabIndex(0);
        }
    },[data]);

    const newData = ({ item }) => {
        return (
            <View style={styles.container}>

                <View style={[styles.divCompView, { flexDirection: isRTL ? 'row-reverse' : 'row',backgroundColor: item.type == 'Credit' ? colors.new1 : (item.type == 'Debit' ? colors.new2 :'#f1c8b7')}]}>
                    <View style={styles.containsView}>
                        <View style={[styles.statusStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            {item.type == 'Credit' ?
                                <View style={[styles.icon, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                                    <Icon
                                        iconStyle={styles.debiticonPositionStyle}
                                        name={isRTL ? 'keyboard-arrow-right' : 'keyboard-arrow-left'}
                                        type='MaterialIcons'
                                        size={32}
                                        color={colors.HEADER}
                                    />

                                </View>
                                : null}
                            {item.type == 'Debit' ?
                                <View style={[styles.icon, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                                    <Icon
                                        iconStyle={styles.crediticonPositionStyle}
                                        name={isRTL ? 'keyboard-arrow-left' : 'keyboard-arrow-right'}
                                        type='MaterialIcons'
                                        size={32}
                                        color={colors.HEADER}
                                    />
                                </View>
                                : null}
                            {item.type == 'Withdraw' ?
                                <View style={[styles.icon, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                                    <Icon
                                        iconStyle={styles.crediticonPositionStyle}
                                        name='keyboard-arrow-down'
                                        type='MaterialIcons'
                                        size={32}
                                        color={colors.HEADER}
                                    />
                                </View>
                                : null}
                            <View style={[styles.statusView, isRTL ? { marginRight: 10 } : { marginLeft: 10 }]}>
                                {item.type && item.type == 'Credit' ?
                                    settings.swipe_symbol === false ?
                                        <Text style={[styles.historyamounttextStyle, { textAlign: isRTL ? "right" : "left" }]}>{t('credited') + ' ' + settings.symbol + parseFloat(item.amount).toFixed(settings.decimal)}</Text>
                                        :
                                        <Text style={[styles.historyamounttextStyle, { textAlign: isRTL ? "right" : "left" }]}>{t('credited') + ' ' + parseFloat(item.amount).toFixed(settings.decimal) + settings.symbol}</Text>
                                    : null}
                                {item.type && item.type == 'Debit' ?
                                    settings.swipe_symbol === false ?
                                        <Text style={[styles.historyamounttextStyle, { textAlign: isRTL ? "right" : "left" }]}>{t('debited') + ' ' + settings.symbol + parseFloat(item.amount).toFixed(settings.decimal)}</Text>
                                        :
                                        <Text style={[styles.historyamounttextStyle, { textAlign: isRTL ? "right" : "left" }]}>{t('debited') + ' ' + parseFloat(item.amount).toFixed(settings.decimal) + settings.symbol}</Text>
                                    : null}
                                {item.type && item.type == 'Withdraw' ?
                                    settings.swipe_symbol === false ?
                                        <Text style={[styles.historyamounttextStyle, { textAlign: isRTL ? "right" : "left" }]}>{t('withdrawn') + ' ' + settings.symbol + parseFloat(item.amount).toFixed(settings.decimal)}</Text>
                                        :
                                        <Text style={[styles.historyamounttextStyle, { textAlign: isRTL ? "right" : "left" }]}>{t('withdrawn') + ' ' + parseFloat(item.amount).toFixed(settings.decimal) + settings.symbol}</Text>
                                    : null}
                                <Text style={[styles.textStyle2, { textAlign: isRTL ? "right" : "left",  fontWeight: '500', }]}>{t('transaction_id')} {item.txRef.startsWith('wallet') ? item.transaction_id : item.txRef}</Text>
                                <Text style={[styles.textStyle2, { textAlign: isRTL ? "right" : "left" }]}>{moment(item.date).format('lll')}</Text>
                            </View>
                        </View>
                    </View>
                </View>

            </View>
        )
    }
    return (
        <View  style={{marginTop:15,flex:1}}>
             <SegmentedControlTab
                    values={props.role && props.role == 'driver' || settings.RiderWithDraw ? [t('credited'), t('debited'), t('withdrawn')] 
                        : [t('credited'),  t('debited')] }
                    selectedIndex={tabIndex}
                    onTabPress={(index) => setTabIndex(index)}
                    borderRadius={0}
                    tabsContainerStyle={[styles.segmentcontrol,{flexDirection:isRTL?'row-reverse':'row'}]}
                    tabStyle={{
                        borderWidth: 0,
                        backgroundColor: 'transparent',
                        borderColor:colors.TRANSPARENT
                    }}
                    activeTabStyle={{ borderBottomColor: colors.HEADER, backgroundColor: 'transparent', borderBottomWidth: 2 }}
                    tabTextStyle={{ color: colors.RIDELIST_TEXT, fontWeight: 'bold', }}
                    activeTabTextStyle={{ color: colors.HEADER }}
                />
            <FlatList
                keyExtractor={(item, index) => index.toString()}
                data={data && data.length> 0? (tabIndex === 0 ? data.filter(item => !(item.type === 'Debit' || item.type === 'Withdraw')) : (tabIndex === 1 ? data.filter(item => item.type === 'Debit') : data.filter(item => item.type === 'Withdraw'))): []}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                renderItem={newData}
            />
        </View>
    );

};
const styles = StyleSheet.create({  
    container: {
        flex: 1
    },
    divCompView: {
        height: 80,
        marginHorizontal: 10,
        marginVertical: 8,
        flexDirection: 'row',
        flex: 1,
        borderRadius: 6,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    icon: {
        height: 40,
        width: 40,
        borderRadius: 20,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.new,
        padding: 3,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    containsView: {
        justifyContent: 'center',
    },

    statusStyle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusView: {
        marginLeft: 10,
    },
    historyamounttextStyle: {
        fontSize: 16,
        fontFamily: 'Roboto-Regular',
        fontWeight: '500',
    },
    textStyle2: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        color: colors.HEADER
    },
    textColor: {
        color: colors.WALLET_PRIMARY,
        alignSelf: 'center',
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        paddingLeft: 5
    },
    textFormat: {
        flex: 1,
        width: Dimensions.get("window").width - 100
    },
    cabLogoStyle: {
        width: 25,
        height: 28,
        flex: 1,
    },
    clockIconStyle: {
        flexDirection: 'row',
        marginTop: 8
    },
    debiticonPositionStyle: {
        alignSelf: 'flex-start',
    },
    crediticonPositionStyle: {
        alignSelf: 'flex-start',
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