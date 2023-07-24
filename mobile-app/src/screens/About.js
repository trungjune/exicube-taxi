import React from 'react';
import { colors } from '../common/theme';
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView
} from 'react-native';
import i18n from 'i18n-js';
import Footer from '../components/Footer'

export default function AboutPage(props) {

    const { t } = i18n;
    const isRTL = i18n.locale.indexOf('he') === 0 || i18n.locale.indexOf('ar') === 0;

    return (
        <View style={{flex:1}}>
            <Footer/>
            <View style={{flex: 1, position: 'absolute',backgroundColor: colors.TRANSPARENT, height:'100%', width: '100%' }}>
            <ScrollView showsVerticalScrollIndicator={false} style={{height:'100%'}}>
                <View style={{ height: 200, width: 200, marginTop: 30, marginBottom: 25, alignSelf: 'center' }}>
                    <Image
                        style={{ width: 200, height: 200, borderRadius: 15 }}
                        source={require('../../assets/images/logo1024x1024.png')}
                    />
                </View>
                <Text style={{ textAlign:'center', fontSize: 20, marginHorizontal:20,marginBottom:40}}>
                    {t('about_us_content1') + ' ' + t('about_us_content2')}
                </Text>
            </ScrollView>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE
    },
    View:{
        height: '100%', 
        borderBottomRightRadius: 120, 
        overflow: 'hidden', 
        backgroundColor: colors.WHITE, 
        alignSelf: 'center',
        width:'100%'
    }   
})