import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Icon } from 'react-native-elements'
import { colors } from '../common/theme';
import { useSelector } from 'react-redux';
import i18n from 'i18n-js';
import moment from 'moment/min/moment-with-locales';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MAIN_COLOR } from '../common/sharedFunctions';

export default function Notifications(props) {
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const notificationdata = useSelector(state => state.notificationdata);
    const [data, setData] = useState();

    useEffect(() => {
        if (notificationdata.notifications) {
            setData(notificationdata.notifications);
        } else {
            setData([]);
        }
    }, [notificationdata.notifications]);

    const show = (item) => {
        Alert.alert(
            item.title,
            item.msg,
            [
                {
                    text: "ok",
                    onPress: () => { },
                    style: "ok",
                },
            ],
            { cancelable: false }
        );
    };

    const newData = ({ item }) => {
        return (
            <View style={styles.container}>
                <View style={[styles.divCompView,{flexDirection: isRTL ? 'row-reverse' : 'row',backgroundColor: MAIN_COLOR }]}>
                    <View style={styles.imageHolder}>
                        <MaterialCommunityIcons name="car-parking-lights" size={33} color={colors.HEADER} />
                    </View>
                    <TouchableOpacity onPress={() => show(item)} style={styles.statusView}>
                        <View style={styles.textFormat}>
                            <Text numberOfLines={1} style={[styles.textStyle1, { textAlign: isRTL ? 'right' : 'left'}]}>{item.title}</Text>
                            <Text numberOfLines={1} style={[styles.textStyle2, { textAlign: isRTL ? 'right' : 'left'}]}>{item.msg}</Text>
                        </View>
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row'}}>
                            <Icon
                                iconStyle={styles.iconPositionStyle}
                                name='clock'
                                type='octicon'
                                size={15}
                                color={colors.RIDELIST_TEXT}
                            />
                            <Text style={[styles.textColor, [isRTL ? { paddingRight: 5 } : { paddingLeft: 5 }]]}>{moment(item.dated).format('lll')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }


    return (
        <View style={{ flex: 1 }}>
            <FlatList
                keyExtractor={(item, index) => index.toString()}
                data={data}
                renderItem={newData}
            />
        </View>
    )

}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    divCompView: {
        borderRadius: 10,
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2,
        elevation: 2,
        marginHorizontal: 10,
        marginVertical: 5,
    },
    imageHolder: {
        height: 50,
        width: '15%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center'
    },
    statusView: {
        flexDirection: 'column',
        height: "100%",
        width: '85%',
        borderRadius: 10,
        backgroundColor: colors.WHITE,padding:8
    },
    textStyle1: {
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
        marginBottom: 2,
        color: colors.RIDELIST_TEXT,
    },
    textStyle2: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
    },
    textColor: {
        color: colors.RIDELIST_TEXT,
        alignSelf: 'center',
        fontSize: 12,
        fontFamily: 'Roboto-Regular',
    },
    iconPositionStyle: {
        alignSelf: 'flex-start'
    }
});