import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    StyleSheet,
    Alert,
    TouchableOpacity
} from 'react-native';
import {  Button, Input } from 'react-native-elements'
import { colors } from '../common/theme';
var { height } = Dimensions.get('window');
import i18n from 'i18n-js';
import RadioForm from 'react-native-simple-radio-button';
import RNPickerSelect from './RNPickerSelect';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { api } from 'common';
import Footer from './Footer';
import { Feather, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { MAIN_COLOR } from '../common/sharedFunctions';

export default function Registration(props) {
    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;
    const {
        countries
    } = api;
    const [state, setState] = useState({
        usertype: 'customer',
        firstName: '',
        lastName: '',
        email: '',
        password:'',
        mobile: '',
        referralId: ''
    });

    const [countryCode, setCountryCode] = useState();
    const [mobileWithoutCountry, setMobileWithoutCountry] = useState('');
    const settings = useSelector(state => state.settingsdata.settings);
    const [confirmpassword,setConfirmPassword] = useState('');
    const [eyePass,setEyePass] = useState(true);
    const [eyeConfirmPass,setEyeConfirmPass] = useState(true);
    const pickerRef1 = React.createRef();

    const radio_props = [
        { label: t('customer'), value: 0 },
        { label: t('driver'), value: 1 }
    ];

    const formatCountries = () => {
        let arr = [];
        for (let i = 0; i < countries.length; i++) {
            let txt = countries[i].label + " (+" + countries[i].phone + ")";
            arr.push({ label: txt, value: txt, key: txt });
        }
        return arr;
    }

    useEffect(() => {
        if (settings) {
            for (let i = 0; i < countries.length; i++) {
                if (countries[i].label == settings.country) {
                    setCountryCode(settings.country + " (+" + countries[i].phone + ")");
                }
            }
        }
    }, [settings]);


    const validateMobile = () => {
        let mobileValid = true;
        if (mobileWithoutCountry.length < 6) {
            mobileValid = false;
            Alert.alert(t('alert'), t('mobile_no_blank_error'));
        }
        return mobileValid;
    }

    const checkPasswordValidity = value => {
        if (value != confirmpassword){
            return(t('confirm_password_not_match_err'));
        }

        const isNonWhiteSpace = /^\S*$/;
        if (!isNonWhiteSpace.test(value)) {
        return(t('password_must_not_contain_whitespaces'));
        }
    
        const isContainsUppercase = /^(?=.*[A-Z]).*$/;
        if (!isContainsUppercase.test(value)) {
        return(t('password_must_have_at_least_one_uppercase_character'));
        }
    
        const isContainsLowercase = /^(?=.*[a-z]).*$/;
        if (!isContainsLowercase.test(value)) {
        return(t('password_must_have_at_least_one_lowercase_character'));
        }
    
        const isContainsNumber = /^(?=.*[0-9]).*$/;
        if (!isContainsNumber.test(value)) {
        return(t('password_must_contain_at_least_one_digit'));
        }
    
        const isValidLength = /^.{8,16}$/;
        if (!isValidLength.test(value)) {
        return(t('password_must_be_8-16_characters_long'));
        }

        return null;
    }

    const onPressRegister = () => {
        const { onPressRegister } = props;
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        const validatePassword = checkPasswordValidity(state.password);
        if (re.test(state.email)) {
            if (/\S/.test(state.firstName) && state.firstName.length > 0 && /\S/.test(state.lastName) && state.lastName.length > 0) {
                if(!validatePassword) {
                    if (validateMobile()) {
                        const userData = { ...state };
                        if (userData.usertype == 'customer') delete userData.carType;
                        onPressRegister(userData);
                    } else {
                        Alert.alert(t('alert'), t('mobile_no_blank_error'));
                    }
                }else {
                    Alert.alert(t('alert'), validatePassword);
                }
            } else {
                Alert.alert(t('alert'), t('proper_input_name'));
            }
        } else {
            Alert.alert(t('alert'), t('proper_email'));
        }
    }

    const upDateCountry = (text) => {
        setCountryCode(text);
        let extNum = text.split("(")[1].split(")")[0];
        let formattedNum = mobileWithoutCountry.replace(/ /g, '');
        formattedNum = extNum + formattedNum.replace(/-/g, '');
        setState({ ...state, mobile: formattedNum })
    }

    const lCom = { icon: 'ios-arrow-back', type: 'ionicon', color: colors.WHITE, size: 35, component: TouchableWithoutFeedback, onPress: props.onPressBack };
    const rCom = { icon: 'ios-arrow-forward', type: 'ionicon', color: colors.WHITE, size: 35, component: TouchableWithoutFeedback, onPress: props.onPressBack };

    return (
        <View style={{flex:1}}>
            <Footer/>
            <View style={{flex: 1, position: 'absolute',backgroundColor: colors.TRANSPARENT, height:'100%', width: '100%' }}>
                <View style={[styles.logo, { backgroundColor: MAIN_COLOR }]}>
                    <TouchableOpacity style={isRTL ? { marginRight: 10, marginBottom: 5, alignSelf: 'flex-end', width: 70, padding: 8,marginTop:12 } : { marginLeft: 10, marginBottom: 5, width: 70, padding: 8,marginTop:12 }} onPress={props.onPressBack}>
                        <Feather name={isRTL ? 'arrow-right' : "arrow-left"} size={40} color="black" />
                    </TouchableOpacity>
                    <Text style={[styles.headerStyle, [isRTL ? { marginRight: 25, textAlign: 'right',padding:8} : { marginLeft: 8,padding:8}]]}>{t('registration_title')}</Text>
                </View>
                <View style={{height: '85%'}}>
                    <ScrollView style={styles.scrollViewStyle} showsVerticalScrollIndicator={false}>
                        <View style={styles.containerStyle}>
                            <KeyboardAvoidingView style={styles.form} behavior={Platform.OS == "ios" ? "padding" : (__DEV__ ? null : "padding" )}>
                                <View style={[styles.textInputContainerStyle, { justifyContent: 'flex-start' }, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="account-supervisor-outline" size={24} color={colors.HEADER} />
                                    </View>
                                    <RadioForm
                                        radio_props={radio_props}
                                        initial={0}
                                        animation={false}
                                        formHorizontal={true}
                                        labelHorizontal={true}
                                        buttonColor={colors.HEADER}
                                        labelColor={colors.HEADER}
                                        style={isRTL ? { marginRight: 20 } : { marginLeft: 20 }}
                                        labelStyle={isRTL ? { marginRight: 10 } : { marginRight: 10 }}
                                        selectedButtonColor={colors.HEADER}
                                        selectedLabelColor={colors.HEADER}
                                        onPress={(value) => {
                                            if (value == 0) {
                                                setState({ ...state, usertype: 'customer' });
                                            } else {
                                                setState({ ...state, usertype: 'driver' });
                                            }
                                        }}
                                    />
                                </View>
                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="account-outline" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%' }}>
                                        <Input
                                            editable={true}
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('first_name_placeholder')}
                                            placeholderTextColor={colors.HEADER}
                                            value={state.firstName}
                                            keyboardType={'email-address'}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={(text) => { setState({ ...state, firstName: text }) }}
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="account-outline" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%' }}>
                                        <Input
                                            editable={true}
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('last_name_placeholder')}
                                            placeholderTextColor={colors.HEADER}
                                            value={state.lastName}
                                            keyboardType={'email-address'}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={(text) => { setState({ ...state, lastName: text }) }}
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                        />
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.textInputContainerStyle,
                                        {
                                            flexDirection: isRTL ? "row-reverse" : "row",
                                        }, { justifyContent: 'flex-start' }
                                    ]}
                                >
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="cellphone-marker" size={24} color={colors.HEADER} /></View>
                                    <View style={{ width: '75%' }}>
                                        <RNPickerSelect
                                            pickerRef={pickerRef1}
                                            key={countryCode}
                                            placeholder={{ label: t('select_country'), value: t('select_country') }}
                                            value={countryCode}
                                            useNativeAndroidPickerStyle={false}
                                            style={{
                                                inputIOS: [styles.pickerStyle, { textAlign: isRTL ? 'right' : 'left', alignSelf: isRTL ? 'flex-end' : 'flex-start' }],
                                                placeholder: {
                                                    color: '#2a483b'
                                                },
                                                inputAndroid: [styles.pickerStyle, { textAlign: isRTL ? 'right' : 'left', alignSelf: isRTL ? 'flex-end' : 'flex-start' }]
                                            }}
                                            onTap={()=>{pickerRef1.current.focus()}}
                                            onValueChange={(text) => { upDateCountry(text); }}
                                            items={formatCountries()}
                                            disabled={settings.AllowCountrySelection ? false : true}
                                            Icon={() => { return <Ionicons style={{ top: 15, marginRight: isRTL ? '80%' : 0 }} name="md-arrow-down" size={24} color="gray" />; }}

                                        /></View>
                                </View>
                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="cellphone-information" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%' }}>
                                        <Input
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('mobile')}
                                            placeholderTextColor={colors.HEADER}
                                            value={mobileWithoutCountry}
                                            keyboardType={'number-pad'}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={
                                                (text) => {
                                                    setMobileWithoutCountry(text)
                                                    let formattedNum = text.replace(/ /g, '');
                                                    formattedNum = countryCode.split("(")[1].split(")")[0] + formattedNum.replace(/-/g, '');
                                                    setState({ ...state, mobile: formattedNum })
                                                }
                                            }
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <Entypo name="email" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%' }}>
                                        <Input
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('email_placeholder')}
                                            placeholderTextColor={colors.HEADER}
                                            value={state.email}
                                            keyboardType={'email-address'}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={(text) => { setState({ ...state, email: text }) }}
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                            autoCapitalize='none'
                                        />
                                    </View>
                                </View>

                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="form-textbox-password" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%',flexDirection: isRTL ? 'row-reverse' : 'row', alignItems:'center' }}>
                                        <Input
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('password')}
                                            placeholderTextColor={colors.HEADER}
                                            value={state.password}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={(text) => setState({ ...state, password: text })}
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                            secureTextEntry={eyePass}
                                        />
                                        <TouchableOpacity onPress={() => setEyePass(!eyePass)}>
                                            {eyePass?
                                                <Feather name="eye-off" size={20} color={colors.HEADER} />
                                            :
                                                <Feather name="eye" size={20} color={colors.HEADER} />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="form-textbox-password" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%',flexDirection: isRTL ? 'row-reverse' : 'row', alignItems:'center'  }}>
                                        <Input
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('confirm_password')}
                                            placeholderTextColor={colors.HEADER}
                                            value={confirmpassword}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={(text) => setConfirmPassword(text)}
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                            secureTextEntry={eyeConfirmPass}
                                        />
                                        <TouchableOpacity onPress={() => setEyeConfirmPass(!eyeConfirmPass)}>
                                            {eyeConfirmPass?
                                                <Feather name="eye-off" size={20} color={colors.HEADER} />
                                            :
                                                <Feather name="eye" size={20} color={colors.HEADER} />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={[styles.textInputContainerStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="account-lock-open-outline" size={24} color={colors.HEADER} />
                                    </View>
                                    <View style={{ width: '75%' }}>
                                        <Input
                                            editable={true}
                                            underlineColorAndroid={colors.TRANSPARENT}
                                            placeholder={t('referral_id_placeholder')}
                                            placeholderTextColor={colors.HEADER}
                                            value={state.referralId}
                                            inputStyle={[styles.inputTextStyle, { textAlign: isRTL ? 'right' : 'left' }]}
                                            onChangeText={(text) => { setState({ ...state, referralId: text }) }}
                                            inputContainerStyle={styles.inputContainerStyle}
                                            containerStyle={styles.textInputStyle}
                                        />
                                    </View>
                                </View>

                                <View style={styles.buttonContainer}>
                                    <Button
                                        onPress={onPressRegister}
                                        title={t('register_button')}
                                        loading={props.loading}
                                        titleStyle={styles.buttonTitle}
                                        buttonStyle={[styles.registerButton, { marginTop: state.usertype == 'driver' ? 30 : 10 }]}
                                    />
                                </View>
                                <View style={styles.gapView} />
                            </KeyboardAvoidingView>  
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%',
    },
    vew: {
        borderTopLeftRadius: 130,
        height: '100%',
        alignItems: 'flex-end',
    },
    textInputContainerStyle: {
        width: '90%',
        height: 65,
        borderRadius: 15,
        marginVertical: 10,
        shadowColor: colors.BLACK,
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
    },
    headerContainerStyle: {
        backgroundColor: colors.RE_GREEN,
        borderBottomWidth: 0,
        marginTop: 0
    },
    headerInnerContainer: {
        marginLeft: 10,
        marginRight: 10
    },
    textInputStyle: {

    },
    inputContainerStyle: {
        width: "100%",
    },
    iconContainer: {
        width: '15%',
        alignItems: 'center'
    },
    gapView: {
        height: 40,
        width: '100%'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 40
    },
    registerButton: {
        width: 180,
        height: 50,
        borderColor: colors.TRANSPARENT,
        borderWidth: 0,
        marginTop: 30,
        borderRadius: 15,
    },
    buttonTitle: {
        fontSize: 16
    },
    pickerStyle: {
        color: colors.HEADER,
        width: 200,
        fontSize: 15,
        height: 40,
        marginBottom: 27,
        margin: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.HEADER,
    },
    inputTextStyle: {
        color: colors.HEADER,
        fontSize: 13,
        marginLeft: 0,
        height: 32,
    },
    errorMessageStyle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 0
    },
    containerStyle: {
        flexDirection: 'column',
        marginTop: 10,
        width: '100%'
    },
    logo: {
        width: '46%',
        justifyContent: "center",
        borderBottomRightRadius: 100,
        borderTopRightRadius: 80,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        marginBottom:3
    },
    scrollViewStyle: {
        flex: 1,
        marginTop: 15
    },
    headerStyle: {
        fontSize: 25,
        color: colors.WHITE,
        flexDirection: 'row',
    },
    capturePhoto: {
        width: '60%',
        height: 110,
        alignSelf: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 10,
        marginTop: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        backgroundColor: colors.WHITE

    },
    capturePhotoTitle: {
        color: colors.BLACK,
        fontSize: 14,
        textAlign: 'center',
        paddingBottom: 15,

    },
    errorPhotoTitle: {
        color: colors.RED,
        fontSize: 13,
        textAlign: 'center',
        paddingBottom: 15,
    },
    photoResult: {
        alignSelf: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: 10,
        marginLeft: 20,
        marginRight: 20,
        paddingTop: 15,
        paddingBottom: 10,
        marginTop: 15,
        width: '80%',
        height: height / 4
    },
    imagePosition: {
        position: 'relative'
    },
    photoClick: {
        paddingRight: 48,
        position: 'absolute',
        zIndex: 1,
        marginTop: 18,
        alignSelf: 'flex-end'
    },
    capturePicClick: {
        backgroundColor: colors.WHITE,
        flexDirection: 'row',
        position: 'relative',
        zIndex: 1
    },
    imageStyle: {
        width: 30,
        height: height / 15
    },
    flexView1: {
        flex: 12
    },
    imageFixStyle: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    imageStyle2: {
        width: 150,
        height: height / 15
    },
    myView: {
        flex: 2,
        height: 50,
        width: 1,
        alignItems: 'center'
    },
    myView1: {
        height: height / 18,
        width: 1.5,
        backgroundColor: colors.BORDER_TEXT,
        alignItems: 'center',
        marginTop: 10
    },
    myView2: {
        flex: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    myView3: {
        flex: 2.2,
        alignItems: 'center',
        justifyContent: 'center'
    },
    textStyle: {
        color: colors.ProfileDetails_Text,
        fontFamily: 'Roboto-Bold',
        fontSize: 13
    }
});