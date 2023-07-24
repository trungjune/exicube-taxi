import React , { useState} from "react";
import { StyleSheet, FlatList, View, Text, TouchableOpacity, Alert, Share, Switch, Linking, ActivityIndicator } from "react-native";
import { Icon } from "react-native-elements";
import i18n from 'i18n-js';
import { colors } from '../common/theme';
import { useSelector, useDispatch } from "react-redux";
import { api } from 'common';
import { MaterialIcons } from '@expo/vector-icons';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { MAIN_COLOR } from "../common/sharedFunctions";
import { appConsts } from '../common/sharedFunctions';

export default function SettingsScreen(props) {
    const { t } = i18n;
    const { signOff, updateProfile } = api;
    const dispatch = useDispatch();
    const auth = useSelector(state => state.auth);
    const settings = useSelector(state => state.settingsdata.settings);
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const [loading, setLoading] = useState(false);

    const menuList = [
        { name: t('profile_setting_menu'), navigationName: 'Profile', icon: 'account-cog-outline', type: 'material-community' },
        { name: t('documents'), navigationName: 'editUser', icon: 'description', type: 'materialIcons' },
        { name: t('incomeText'), navigationName: 'MyEarning', icon: 'attach-money', type: 'materialIcons' },
        { name: auth.profile && auth.profile && auth.profile.usertype == "driver" ? t('convert_to_rider') : t('convert_to_driver'), navigationName: 'Convert', icon: 'account-convert-outline', type: 'material-community' },
        { name: t('cars'), navigationName: 'Cars', icon: 'car-cog', type: 'material-community' },
        { name: t('refer_earn'), navigationName: 'Refer', icon: 'cash-outline', type: 'ionicon' },
        { name: t('emergency'), navigationName: 'Emergency', icon: 'ios-sad-outline', type: 'ionicon' },
        { name: t('push_notification_title'), navigationName: 'Notifications', icon: 'notifications-outline', type: 'ionicon' },
        { name: t('about_us_menu'), navigationName: 'About', icon: 'info', type: 'entypo' },
        { name: t('logout'), icon: 'logout', navigationName: 'Logout', type: 'antdesign' }
    ];
    const panic = () => {
        Alert.alert(
            t('panic_text'),
            t('panic_question'),
            [
                {
                    text: t('cancel'),
                    onPress: () => { },
                    style: 'cancel'
                },
                {
                    text: t('ok'), onPress: async () => {
                        let call_link = Platform.OS == 'android' ? 'tel:' + settings.panic : 'telprompt:' + settings.panic;
                        Linking.openURL(call_link);
                    }
                }
            ],
            { cancelable: false }
        )
    }

    const convert = () => {
        Alert.alert(
            t('convert_button'),
            auth.profile && auth.profile.usertype == "driver" ? t('convert_to_rider') : t('convert_to_driver'),
            [
                {
                    text: t('cancel'),
                    onPress: () => { },
                    style: 'cancel'
                },
                {
                    text: t('ok'), onPress: async () => {
                        let userData = {
                            approved: (auth.profile && auth.profile.usertype == "driver" ? true : settings && settings.driver_approval ? false : true),
                            usertype: auth.profile && auth.profile.usertype == "driver" ? "customer" : "driver",
                            queue: (auth.profile && auth.profile.queue === true)? true: false,
                            driverActiveStatus: false
                        }
                        dispatch(updateProfile(userData));
                        setTimeout(()=>{
                            if(userData.usertype == 'driver'){
                                dispatch(api.fetchBookings());
                                dispatch(api.fetchTasks());
                                dispatch(api.fetchCars());
                            }else{
                                StopBackgroundLocation();
                                dispatch(api.fetchAddresses());
                                dispatch(api.fetchBookings());
                            }
                        },3000);
                    }
                }
            ],
            { cancelable: false }
        )
    }

    const StopBackgroundLocation = async () => {
        TaskManager.getRegisteredTasksAsync().then((res) => {
            if (res.length > 0) {
                for (let i = 0; i < res.length; i++) {
                    if (res[i].taskName == 'background-location-task') {
                        Location.stopLocationUpdatesAsync('background-location-task');
                        break;
                    }
                }
            }
        });
    }


    const refer = () => {
        settings.bonus > 0 ?
            Share.share({
                message: t('share_msg') + settings.code + ' ' + settings.bonus + ".\n" + t('code_colon') + auth.profile.referralId + "\n" + t('app_link') + (Platform.OS == "ios" ? settings.AppleStoreLink : settings.PlayStoreLink)
            })
            :
            Share.share({
                message: t('share_msg_no_bonus') + "\n" + t('app_link') + (Platform.OS == "ios" ? settings.AppleStoreLink : settings.PlayStoreLink)
            })
    }

    const logOff = () => {
        auth.info && auth.info.profile && auth.info.profile.usertype == 'driver' ? StopBackgroundLocation() : null;
        setLoading(true);
        setTimeout(() => {
            dispatch(signOff());
        }, 1000);
    }

    return (
        <View style={styles.mainView}>
            <FlatList
                keyExtractor={(item, index) => index.toString()}
                data={menuList}
                scrollEnabled={true}
                renderItem={({ item, index }) => {
                    if (auth.profile && auth.profile.usertype == "customer" && (item.navigationName == "Cars" || item.navigationName == "MyEarning")) {
                        return null;
                    } else if (auth.profile && auth.profile.usertype == "driver" && (item.navigationName == "Emergency")) {
                        return null;
                    } else if (auth.profile && auth.profile.usertype == "customer" && (item.navigationName == "Emergency") && !appConsts.needEmergemcy ) {
                        return null;
                    } else if (auth.profile && auth.profile.usertype == "customer" && (item.navigationName == "Emergency") && !(settings && settings.panic && settings.panic.length>0)) {
                        return null;
                    }else if (auth.profile && auth.profile.usertype == "customer" && (item.navigationName == "editUser") && !(settings && ((settings.bank_fields && settings.RiderWithDraw)|| settings.imageIdApproval))) {
                        return null;
                    }else if (auth.profile && auth.profile.usertype == "driver" && (item.navigationName == "editUser") && !(settings && (settings.bank_fields || settings.imageIdApproval || settings.license_image_required ))) {
                        return null;
                    } else {
                        return (
                            <View style={[styles.vew, { backgroundColor: MAIN_COLOR }]}>
                                <TouchableOpacity
                                    style={{ height: '100%', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}
                                    key={item.navigationName}
                                    onPress={() => {
                                        if (item.navigationName === 'Emergency' ) {
                                            panic();
                                        } else if (item.navigationName === 'Refer') {
                                            refer();
                                        } else if (item.navigationName === 'Logout') {
                                            logOff();
                                        } else if (item.navigationName === 'Convert') {
                                            convert();
                                        } else {
                                            props.navigation.navigate(item.navigationName)
                                        }
                                    }}
                                >
                                    <View style={[styles.vew1, [isRTL ? { flexDirection: 'row-reverse', borderTopLeftRadius: 50, borderBottomLeftRadius: 50, } : {
                                        flexDirection: 'row', borderTopRightRadius: 50,
                                        borderBottomRightRadius: 50,
                                    }]]}>
                                        <Icon
                                            name={item.icon}
                                            type={item.type}
                                            color={colors.BLACK}
                                            size={26}
                                            containerStyle={{ margin: 15 }}
                                        />
                                        <Text style={{ color: colors.BLACK }}>{item.name}</Text>
                                        {loading && item.navigationName === 'Logout' ?
                                        <View style={{ position:'absolute', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                                            <ActivityIndicator color={colors.BLACK} size='large' style={{marginLeft:isRTL ? 0:50,marginRight:isRTL ? 50:0}}/>
                                        </View>
                                        : null}
                                    </View>
                                    <View style={{ height: '100%', width: '12%', alignItems: 'center', justifyContent: 'center' }}>
                                        <MaterialIcons name={isRTL ? "keyboard-arrow-left" : "keyboard-arrow-right"} size={30} color="black" />
                                    </View>
                                </TouchableOpacity>
                            </View>

                        )
                    }
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE
    },
    vew: {
        flex: 1,
        height: 60,
        width: '95%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
        marginVertical: 6,
        alignSelf: 'center',
        borderRadius: 10,
    },
    vew1: {
        width: '88%',
        backgroundColor: colors.WHITE,
        height: '100%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        borderRadius: 10,
    },
    pickerStyle: {
        color: colors.BLACK,
        width: 45,
        marginRight: 3,
        fontSize: 15,
        height: 30,
        fontWeight: 'bold',
    },
    pickerStyle1: {
        color: colors.BLACK,
        width: 68,
        fontSize: 15,
        height: 30,
        fontWeight: 'bold',
        marginLeft: 3,
    },
    headerTitleStyle: {
        color: colors.WHITE,
        fontFamily: 'Roboto-Bold',
    },
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40
    },
});
