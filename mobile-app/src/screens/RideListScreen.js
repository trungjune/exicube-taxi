import React, { useEffect,useState } from 'react';
import { RideList } from '../components';
import {
    StyleSheet,
    View
} from 'react-native';
import { colors } from '../common/theme';
import i18n from 'i18n-js';
import { useSelector } from 'react-redux';

export default function RideListPage(props) {
    const bookings = useSelector(state => state.bookinglistdata.bookings);
    const settings = useSelector(state => state.settingsdata.settings);
    const fromBooking  = props.route.params?props.route.params: null;
    const [bookingData,setBookingData] = useState([]);
    const [tabIndex, setTabIndex] = useState(-1);

    useEffect(()=>{
        if(bookings){
            setBookingData(bookings);
            if(fromBooking){
                const lastStatus = bookings[0].status;
                if(lastStatus == 'COMPLETE') setTabIndex(1);
                if(lastStatus == 'CANCELLED') setTabIndex(2);
            }else{
                setTabIndex(0);
            }
        }else{
            setBookingData([]);
            setTabIndex(0);
        }
    },[bookings]);

    const goDetails = (item, index) => {
        if (item && item.trip_cost > 0) {
            item.roundoffCost = Math.round(item.trip_cost).toFixed(settings.decimal);
            item.roundoff = (Math.round(item.roundoffCost) - item.trip_cost).toFixed(settings.decimal);
            props.navigation.push('RideDetails', { data: item });
        } else {
            item.roundoffCost = Math.round(item.estimate).toFixed(settings.decimal);
            item.roundoff = (Math.round(item.roundoffCost) - item.estimate).toFixed(settings.decimal);
            props.navigation.push('RideDetails', { data: item });
        }
    }

    return (
        <View style={styles.mainView}>
            {tabIndex>=0?
                <RideList onPressButton={(item, index) => { goDetails(item, index) }} data={bookingData} tabIndex={tabIndex}></RideList>
            :null}
        </View>
    );

}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        backgroundColor: colors.WHITE
    }
});
