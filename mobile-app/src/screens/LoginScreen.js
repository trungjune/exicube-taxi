import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    ImageBackground,
    Text,
    Dimensions,
    Alert,
    TextInput,
    Image,
    ActivityIndicator,
    Platform,
    Linking,
    Keyboard,
    ScrollView
} from "react-native";
import MaterialButtonDark from "../components/MaterialButtonDark";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useDispatch, useSelector } from 'react-redux';
import { api } from 'common';
import { colors } from '../common/theme';
import RNPickerSelect from '../components/RNPickerSelect';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from "expo-crypto";
import i18n from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Feather, Ionicons } from '@expo/vector-icons';
import moment from 'moment/min/moment-with-locales';
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import rnauth from '@react-native-firebase/auth';
var { width } = Dimensions.get('window');

export default function LoginScreen(props) {
    const {
        clearLoginError,
        requestPhoneOtpDevice,
        mobileSignIn,
        countries,
        facebookSignIn,
        appleSignIn,
        verifyEmailOtp,
        verifyEmailPassword,
        sendResetMail,
        checkUserExists
    } = api;
    const auth = useSelector(state => state.auth);
    const settings = useSelector(state => state.settingsdata.settings);
    const dispatch = useDispatch();

    const formatCountries = () => {
        let arr = [];
        for (let i = 0; i < countries.length; i++) {
            let txt = countries[i].label + " (+" + countries[i].phone + ")";
            arr.push({ label: txt, value: txt, key: txt });
        }
        return arr;
    }

    const [state, setState] = useState({
        entryType: null,
        contact: null,
        verificationId: null,
        verificationCode: null,
        countryCodeList: formatCountries(),
        countryCode: null
    });

    const pageActive = useRef(false);
    const [loading, setLoading] = useState(false);
    const [newUserText, setNewUserText] = useState(false);

    const { t } = i18n;
    const [isRTL,setIsRTL] = useState();
    const [langSelection, setLangSelection] = useState();
    const languagedata = useSelector(state => state.languagedata);
    const [eyePass,setEyePass] = useState(true);
    const [isNewUser,setIsNewUser] = useState(false);
    const pickerRef1 = React.createRef();
    const pickerRef2 = React.createRef();
    const [keyboardStatus, setKeyboardStatus] = useState("Keyboard Hidden");

    useEffect(() => {
        AsyncStorage.getItem('lang', (err, result) => {
            if(result){
                const langLocale = JSON.parse(result)['langLocale']
                setIsRTL(langLocale == 'he' || langLocale == 'ar')
                setLangSelection(langLocale);
            }else{
                setIsRTL(i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0)
                setLangSelection(i18n.locale);
            }
        });
    }, []);

    useEffect(() => {
        if (settings) {
            for (let i = 0; i < countries.length; i++) {
                if (countries[i].label == settings.country) {
                    setState({ ...state, countryCode: settings.country + " (+" + countries[i].phone + ")" })
                }
            }
        }
    }, [settings]);

    useEffect(() => {
        if (auth.profile && pageActive.current) {
            pageActive.current = false;
            setLoading(false);
            setNewUserText(false);
        }
        if (auth.error && auth.error.msg && pageActive.current && auth.error.msg.message !== t('not_logged_in')) {
            pageActive.current = false;
            setState({ ...state, verificationCode: '' });
            Alert.alert(t('alert'), t('login_error'));
        
            dispatch(clearLoginError());
            setLoading(false);
        }
        if (auth.verificationId) {
            pageActive.current = false;
            setState({ ...state, verificationId: auth.verificationId });
            setLoading(false);
        }
    }, [auth.profile, auth.error, auth.error.msg, auth.verificationId]);

    const onPressLogin = async () => {
        setLoading(true);
        if (state.countryCode && state.countryCode !== t('select_country')) {
            if (state.contact){
                if (isNaN(state.contact)) {
                    setState({...state, entryType: 'email'});
                    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    if(re.test(state.contact)){
                        pageActive.current = true;
                        dispatch(verifyEmailPassword(
                            state.contact,
                            state.verificationCode
                        ));
                    }else{
                        Alert.alert(t('alert'),t('proper_email'));
                        setLoading(false);
                    }
                }else{
                    setState({...state, entryType: 'mobile'});
                    let formattedNum = state.contact.replace(/ /g, '');
                    formattedNum = state.countryCode.split("(")[1].split(")")[0] + formattedNum.replace(/-/g, '');
                    if (formattedNum.length > 6) {
                        checkUserExists({mobile:formattedNum}).then(async(res) => {
                            if (res.users && res.users.length > 0) {
                                setIsNewUser(false);
                                if (auth.verificationId) {
                                    pageActive.current = false;
                                    setState({ ...state, verificationId: auth.verificationId });
                                    setLoading(false);
                                }
                                const confirmation = await rnauth().signInWithPhoneNumber(formattedNum);

                                if(confirmation && confirmation.verificationId){
                                    dispatch(requestPhoneOtpDevice(confirmation.verificationId));
                                }else{
                                    Alert.alert(t('alert'), t('auth_error'));
                                    setLoading(false);
                                }
                            }
                            else if(res.error){
                                Alert.alert(t('alert'), t('email_or_mobile_issue'));
                                setLoading(false);
                            } else{
                                setIsNewUser(true);
                                rnauth().verifyPhoneNumber(formattedNum).then((confirmation) => {
                                    if(confirmation && confirmation.verificationId){
                                        dispatch(requestPhoneOtpDevice(confirmation.verificationId));
                                    }else{
                                        Alert.alert(t('alert'), t('auth_error'));
                                        setLoading(false);
                                    }
                                }).catch((error)=>{
                                    Alert.alert(t('alert'), t('auth_error'));
                                    setLoading(false);
                                });
                            }
                        });
                    } else {
                        Alert.alert(t('alert'), t('mobile_no_blank_error'));
                        setLoading(false);
                    }
                }
            } else {
                Alert.alert(t('alert'), t('contact_input_error'));
                setLoading(false);
            }
        } else {
            Alert.alert(t('alert'), t('country_blank_error'));
            setLoading(false);
        }
    }

    const onSignIn = async () => {
        if(state.verificationCode){
            setLoading(true);
            if(isNewUser){
                setNewUserText(true);
            }
            pageActive.current = true;
            if(state.entryType == 'email'){
                dispatch(verifyEmailOtp(
                    state.contact,
                    state.verificationCode
                ));
            }else{
                dispatch(mobileSignIn(
                    state.verificationId,
                    state.verificationCode
                ));
            }
        }else{
            setNewUserText(false);
            Alert.alert(t('alert'), t('otp_blank_error'));
            setLoading(false);
        }
    }

    const CancelLogin = () => {
        setNewUserText(false);
        setState({
            ...state,
            contact: null,
            verificationId: null,
            verificationCode: null
        });
    }


    const FbLogin = async () => {
        try {
            LoginManager.logInWithPermissions(["public_profile"]).then(
                function (result) {
                    if (result.isCancelled) {
                        console.log("Login cancelled");
                    } else {
                        AccessToken.getCurrentAccessToken().then(
                            (data) => {
                                pageActive.current = true;
                                dispatch(facebookSignIn(data.accessToken.toString()));
                            }
                        )
                    }
                },
                function (error) {
                     Alert.alert(t('alert'), t('facebook_login_auth_error'));
                }
            );
        } catch (error) {
            console.log(error);
            Alert.alert(t('alert'), t('facebook_login_auth_error'));
        }
    }

    const AppleLogin = async () => {
        const csrf = Math.random().toString(36).substring(2, 15);
        const nonce = Math.random().toString(36).substring(2, 10);
        const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
        try {
            const applelogincredentials = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                state: csrf,
                nonce: hashedNonce
            });

            pageActive.current = true;
            dispatch(appleSignIn({
                idToken: applelogincredentials.identityToken,
                rawNonce: nonce,
            }));

        } catch (error) {
            if (error.code === 'ERR_CANCELED') {
                console.log(error);
            } else {
                Alert.alert(t('alert'), t('apple_signin_error'));
            }
        }
    }

    const openRegister = () => {
        pageActive.current = false;
        props.navigation.navigate("Register");
    }

    const openTerms = async () => {
        Linking.openURL(settings.CompanyTerms).catch(err => console.error("Couldn't load page", err));
    }

    const  forgotPassword = () => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        if(re.test(state.contact)){
            Alert.alert(
                t('alert'),
                t('set_link_email'),
                [
                    { text: t('cancel'), onPress: () => { }, style: 'cancel' },
                    { text: t('ok'),  onPress: () => {
                        pageActive.current = true;
                        dispatch(sendResetMail(state.contact));
                    }, },
                ],
                { cancelable: true },
            );
        }else{
            Alert.alert(t('alert'),t('proper_email'));
            setLoading(false);
        }
    }

    useEffect(() => {
      const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardStatus('Keyboard Shown');
      });
      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardStatus('Keyboard Hidden');
      });
  
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }, []);
  
    return (
  
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/images/bg.jpg')}
                resizeMode="stretch"
                style={[styles.imagebg,{marginTop: keyboardStatus == 'Keyboard Shown' ? -(width*0.55) : null }]}
            >
                <View style={styles.topBar}>
                </View>
                {langSelection && languagedata && languagedata.langlist && languagedata.langlist.length > 1  ?
                <View style={[styles.headLanuage,[isRTL?{left:10}:{right: 10}]]}>
                <Text style={{ color: colors.BLACK, marginLeft: 3 }}>{t('lang1')}</Text>
                    <RNPickerSelect
                        pickerRef={pickerRef1}
                        placeholder={{}}
                        value={langSelection}
                        useNativeAndroidPickerStyle={false}
                    
                        style={{
                            inputIOS: styles.pickerStyle1,
                            inputAndroid: styles.pickerStyle1,
                            placeholder: {
                                color: 'white'
                            },

                        }}
                        onTap={()=>{pickerRef1.current.focus()}}
                        onValueChange={
                            (text) => {
                                let defl = null;
                                for (const value of Object.values(languagedata.langlist)) {
                                   if(value.langLocale == text){
                                      defl = value;
                                   }
                                }
                                setLangSelection(text);
                                i18n.locale = text;
                                moment.locale(defl.dateLocale);
                                setIsRTL(text == 'he' || text == 'ar')
                                AsyncStorage.setItem('lang', JSON.stringify({langLocale:text,dateLocale:defl.dateLocale }));
                            }
                        }
                        label={"Language"}
                        items={Object.values(languagedata.langlist).map(function (value) { return { label: value.langName, value: value.langLocale }; })}
                        Icon={() => { return <Ionicons style={{ marginTop: 3,}} name="md-arrow-down" size={20} color="gray" />; }}
                    />
                </View>
                :null}
                
                {loading ?
                    <View style={styles.loading}>
                        <ActivityIndicator color={colors.BLACK} size='large' />
                    {newUserText?
                        <Text style={styles.sepText}>{t('create_new_user')}</Text>
                    :null}
                    </View>
                : null}
                <ScrollView>
                {!isNaN(state.contact) ?
                <View style={[styles.box1]}>
                    <RNPickerSelect
                        pickerRef={pickerRef2}
                        placeholder={{ label: t('select_country'), value: t('select_country') }}
                        value={state.countryCode}
                        useNativeAndroidPickerStyle={false}
                        onTap={()=>{
                            Keyboard.dismiss(); 
                            pickerRef2.current.focus();
                        }}
                        style={{
                            inputIOS: [styles.pickerStyle, { textAlign: isRTL ? "right" : "left" }],
                            inputAndroid: [styles.pickerStyle, { textAlign: isRTL ? "right" : "left" }]
                        }}
                        onValueChange={(value) => setState({ ...state, countryCode: value })}
                        items={state.countryCodeList}
                        disabled={!!state.verificationId || !settings.AllowCountrySelection ? true : false}
                    />
                </View>
                : null }

                <View style={styles.box2}>
                    <TextInput
                        style={[styles.textInput, { textAlign: isRTL ? "right" : "left" }]}
                        placeholder={t('contact_placeholder')}
                        onChangeText={(value) => setState({ ...state, contact: value })}
                        value={state.contact}
                        editable={!!state.verificationId ? false : true}
                        placeholderTextColor={colors.MAP_TEXT}
                        autoCapitalize='none'
                    />
                </View>

                {isNaN(state.contact) ?
                <View style={[styles.box2,{flexDirection: isRTL ? 'row-reverse' : 'row', borderWidth: 1,  alignContent: 'center'}]}>
                    <TextInput
                        style={[styles.textInput1, { textAlign: isRTL ? "right" : "left" }]}
                        placeholder={t('password')}
                        onChangeText={(value) => setState({ ...state, verificationCode: value })}
                        value={state.verificationCode}
                        secureTextEntry={eyePass}
                        placeholderTextColor={colors.MAP_TEXT}
                    />
                    <TouchableOpacity onPress={() => setEyePass(!eyePass)} style={{marginTop: 10, width: 40, marginLeft: isRTL ?0:10 }}>
                        {eyePass?
                            <Feather name="eye-off" size={20} color={colors.HEADER} />
                        :
                            <Feather name="eye" size={20} color={colors.HEADER} />
                        }
                    </TouchableOpacity>
                </View>
                : null}

                {state.verificationId ? null :
                    <MaterialButtonDark
                        onPress={onPressLogin}
                        style={styles.materialButtonDark}
                    >{isNaN(state.contact) ? t('signIn') : t('request_otp')}</MaterialButtonDark>
                }
                {!!state.verificationId ?
                    <View style={styles.box2}>
                        <TextInput
                            style={[styles.textInput, { textAlign: isRTL ? "right" : "left" }]}
                            placeholder={t('otp_here')}
                            onChangeText={(value) => setState({ ...state, verificationCode: value })}
                            value={state.verificationCode}
                            editable={!!state.verificationId}
                            keyboardType="phone-pad"
                            secureTextEntry={true}
                            placeholderTextColor={colors.MAP_TEXT}
                        />
                    </View>
                    : null}
                {!!state.verificationId ?
                    <MaterialButtonDark
                        onPress={onSignIn}
                        style={styles.materialButtonDark}
                    >{t('verify_otp')}</MaterialButtonDark>
                : null}

                {state.verificationId || isNaN(state.contact) ?
                <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
                    {state.verificationId || isNaN(state.contact) ?
                        <View style={styles.actionLine}>
                            <TouchableOpacity style={styles.actionItem} onPress={CancelLogin}>
                                <Text style={styles.actionText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    : null}

                    {isNaN(state.contact) ?
                        <View style={styles.actionLine}>
                            <TouchableOpacity style={styles.actionItem} onPress={forgotPassword}>
                                <Text style={styles.actionText}>{t('forgot_password')}</Text>
                            </TouchableOpacity>
                        </View>
                    : null}
                </View>
                : null}

                {(Platform.OS == 'ios' && settings && settings.AppleLoginEnabled) || (settings && settings.FacebookLoginEnabled) ?
                <View style={styles.seperator}>
                    <View style={styles.lineLeft}></View>
                    <View style={styles.lineLeftFiller}>
                        <Text style={styles.sepText}>{t('spacer_message')}</Text>
                    </View>
                    <View style={styles.lineRight}></View>
                </View>
                : null}

            {(Platform.OS == 'ios' && settings && settings.AppleLoginEnabled) || (settings && settings.FacebookLoginEnabled) ?
                <View style={styles.socialBar}>
                    {settings && settings.FacebookLoginEnabled ?
                        <TouchableOpacity style={styles.socialIcon} onPress={FbLogin}>
                            <Image
                                source={require("../../assets/images/image_fb.png")}
                                resizeMode="contain"
                                style={styles.socialIconImage}
                            ></Image>
                        </TouchableOpacity>
                        : null}
                    {Platform.OS == 'ios' && settings.AppleLoginEnabled ?
                        <TouchableOpacity style={styles.socialIcon} onPress={AppleLogin}>
                            <Image
                                source={require("../../assets/images/image_apple.png")}
                                resizeMode="contain"
                                style={styles.socialIconImage}
                            ></Image>
                        </TouchableOpacity>
                        : null}
                </View>
                : null}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.terms} onPress={openRegister}>
                    <Text style={styles.actionText}>{t('register_as_driver')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.terms} onPress={openTerms}>
                    <Text style={styles.actionText}>{t('terms')}</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
            </ImageBackground>
        </View>

    );
}

const styles = StyleSheet.create({
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
       
    },
    container: {
        flex: 1,
    },
    imagebg: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: Dimensions.get('window').width,      
        height: Dimensions.get('window').height + (Platform.OS == 'android' && !__DEV__? 40 : 0),
    },
    topBar: {
        marginTop: 0,
        marginLeft: 0,
        marginRight: 0,
        height: (Dimensions.get('window').height * 0.52) + (Platform.OS == 'android' && !__DEV__ ? 40 : 0),
    },
    backButton: {
        height: 40,
        width: 40,
        marginTop: 30,
    },
    segmentcontrol: {
        color: colors.WHITE,
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        marginTop: 0,
        alignSelf: "center",
        height: 50,
        marginLeft: 35,
        marginRight: 35
    },
    box1: {
        height: 45,
        backgroundColor: colors.WHITE,
        marginTop: Platform.OS === 'ios' ? 26: 0,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: colors.BORDER_BACKGROUND,
        justifyContent: 'center',
        borderRadius:5
    },
    box2: {
        height: 45,
        backgroundColor: colors.WHITE,
        marginTop: 10,
        marginLeft: 35,
        marginRight: 35,
        borderWidth: 1,
        borderColor: colors.BORDER_BACKGROUND,
        justifyContent: 'center',
        borderRadius:5
    },
    textInput: {
        color: colors.BACKGROUND,
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        marginTop: 8,
        marginLeft: 5
    },
    textInput1: {
        color: colors.BACKGROUND,
        fontSize: 18,
        fontFamily: "Roboto-Regular",
        width: width-130
    },
    materialButtonDark: {
        height: 45,
        marginTop: 15,
        marginLeft: 35,
        marginRight: 35,
        backgroundColor: colors.HEADER,
        borderRadius:10
    },
    linkBar: {
        flexDirection: "row",
        marginTop: 30,
        alignSelf: 'center'
    },
    barLinks: {
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center",
        fontSize: 18,
        fontWeight: 'bold'
    },
    linkText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.WHITE,
        fontFamily: "Roboto-Bold",
    },
    pickerStyle: {
        color: colors.BACKGROUND,
        fontFamily: "Roboto-Regular",
        fontSize: 18,
        marginLeft: 5,
    },

    actionLine: {
        height: 20,
        flexDirection: "row",
        marginTop: 15,
        alignSelf: 'center'
    },
    actionItem: {
        height: 20,
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center"
    },
    actionText: {
        fontSize: 15,
        fontFamily: "Roboto-Regular",
        fontWeight: 'bold',
        color: colors.HEADER
    },
    actionLine: {
        height: 20,
        flexDirection: "row",
        marginTop: 20,
        alignSelf: 'center'
    },
    actionItem: {
        height: 20,
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center"
    },
    seperator: {
        width: 250,
        height: 20,
        flexDirection: "row",
        marginTop: 15,
        alignSelf: 'center'
    },
    lineLeft: {
        width: 50,
        height: 1,
        backgroundColor: "rgba(113,113,113,1)",
        marginTop: 9
    },
    sepText: {
        color: colors.HEADER,
        fontSize: 14,
        fontFamily: "Roboto-Regular",
        opacity: .8
    },
    lineLeftFiller: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center"
    },
    lineRight: {
        width: 50,
        height: 1,
        backgroundColor: "rgba(113,113,113,1)",
        marginTop: 9
    },
    socialBar: {
        height: 40,
        flexDirection: "row",
        marginTop: 10,
        alignSelf: 'center'
    },
    socialIcon: {
        width: 40,
        height: 40,
        marginLeft: 15,
        marginRight: 15,
        alignSelf: "center"
    },
    socialIconImage: {
        width: 40,
        height: 40
    },
    footer: {
        marginTop: Platform.OS === 'ios' ? 20: 12,
        flexDirection:'row',
        justifyContent: 'space-evenly',
    },
    terms: {

        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: "center",
        opacity: .65
    },
    pickerStyle1: {
        color: colors.BLACK,
        width: 68,
        fontSize: 15,
        height: 30,
        fontWeight: 'bold',
    },
    headLanuage:{
        position:'absolute',
        top:Platform.OS=='android' && !__DEV__?40:35,
        flexDirection:'row',
        borderWidth:0.4,
        borderRadius: 20,
        alignItems:'center'
    }
});