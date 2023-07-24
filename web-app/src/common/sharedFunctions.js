import React from 'react';
import moment from 'moment/min/moment-with-locales';
import {
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import { useTranslation } from "react-i18next";
export const calcEst = false;
export const showEst = true;
export const optionsRequired = false;

export const bookingHistoryColumns = (role, settings, t, isRTL) => [
    { title: t('booking_id'), field: 'id', cellStyle: isRTL=== 'rtl' ? {paddingRight:220}:{paddingLeft:220}, headerStyle: isRTL=== 'rtl' ?{paddingRight:220}:{paddingLeft:220}, },
    { title: t('booking_ref'), field: 'reference', cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}  },
    { title: t('booking_date'), field: 'bookingDate', render: rowData => rowData.bookingDate?moment(rowData.bookingDate).format('lll'):null,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('trip_start_time'), field: 'tripdate', render: rowData => rowData.tripdate?moment(rowData.tripdate).format('lll'):null,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('car_type'), field: 'carType',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}  },
    { title: t('customer_name'),field: 'customer_name',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}  },
    { title: t('pickup_address'), field: 'pickupAddress', cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('drop_address'), field: 'dropAddress', cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('assign_driver'), field: 'driver_name',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('booking_status'), field: 'status', render: rowData => <span>{t(rowData.status)}</span>,cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}  },
    { title: t('fleetadmins'), hidden: role==='admin'? false: true, field: 'fleetadmin',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('cancellation_reason'), field: 'reason',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('cancellationFee'), render: rowData => <span>{rowData.cancellationFee? rowData.cancellationFee :(0).toFixed(settings.decimal)}</span>, cellStyle:{paddingLeft: isRTL=== 'rtl'?40:null}},
    { title: t('otp'), field: 'otp',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('trip_cost'), field: 'trip_cost',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('trip_start_time'), field: 'trip_start_time',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('trip_end_time'), field: 'trip_end_time',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('total_time'), field: 'total_trip_time',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('distance'), field: 'distance',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('vehicle_no'), field: 'vehicle_number',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },  
    { title: t('trip_cost_driver_share'), hidden: role==='customer'? true: false, field: 'driver_share',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('convenience_fee'), hidden: role==='customer'? true: false, field: 'convenience_fees',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('discount_ammount'), field: 'discount',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},      
    { title: t('Customer_paid'), field: 'customer_paid',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('payment_mode'), field: 'payment_mode',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('payment_gateway'), field: 'gateway',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'} },
    { title: t('cash_payment_amount'), field: 'cashPaymentAmount',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('card_payment_amount'), field: 'cardPaymentAmount',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}},
    { title: t('wallet_payment_amount'), field: 'usedWalletMoney',cellStyle:{textAlign:isRTL=== 'rtl' ?'right':'left'}}
];

export const BookingModalBody = (props) => {
    const { t, i18n  } = useTranslation();
    const isRTL = i18n.dir();
    const { classes, handleChange, auth, profileData } = props;
    return (
        <span>
            {auth.profile.usertype === 'customer' && !auth.profile.firstName ?
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                required = {auth.profile.firstName ? false : true }
                fullWidth
                id="firstName"
                label={t('firstname')}
                name="firstName"
                autoComplete="firstName"
                onChange={handleChange}
                value={profileData.firstName}
                autoFocus
                className={isRTL==='rtl'?classes.inputRtl:null}
                style={{direction:isRTL==='rtl'?'rtl':'ltr'}}
              />
            </Grid>
            : null }
            {auth.profile.usertype === 'customer' && !auth.profile.lastName ?
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                required = {auth.profile.lastName ? false : true }
                fullWidth
                id="lastName"
                label={t('lastname')}
                name="lastName"
                autoComplete="lastName"
                onChange={handleChange}
                value={profileData.lastName}
                className={isRTL==='rtl'?classes.inputRtl:null}
                style={{direction:isRTL==='rtl'?'rtl':'ltr'}}
              />
            </Grid>
            : null }
            {auth.profile.usertype === 'customer' && !auth.profile.email ?
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                required = {auth.profile.email ? false : true }
                fullWidth
                id="email"
                label={t('email')}
                name="email"
                autoComplete="email"
                onChange={handleChange}
                value={profileData.email}
                className={isRTL==='rtl'?classes.inputRtl:null}
                style={{direction:isRTL==='rtl'?'rtl':'ltr'}}
              />
            </Grid>
            : null }
            <Typography component="h2" variant="h5" style={{marginTop:15, color:'#000'}}>
                { t('estimate_fare_text')}
            </Typography>
        </span>
    )
}

export const validateBookingObj = (t, bookingObject, instructionData) => {
    delete bookingObject.driverEstimates;
    return { bookingObject };
}

export const PanicSettings = (props) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir();
    const { classes, data, handleTextChange } = props;
    return (
        <span>
            <Typography component="h1" variant="h5" style={{ marginTop: '15px', textAlign: isRTL === 'rtl' ? 'right' : 'left' }}>
                {t('panic_num')}
            </Typography>
            <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="panic"
                label={t('panic_num')}
                className={isRTL === "rtl" ? [classes.rootRtl_1, classes.right] : null}
                name="panic"
                autoComplete="panic"
                onChange={handleTextChange}
                value={data.panic}
            />
        </span>
    )
}

export const DispatchSettings = (props) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir();
    const { autoDispatch, onChange } = props;
    return (
        <FormControlLabel
            style={{ flexDirection: isRTL === 'rtl' ? 'row-reverse' : 'row' }}
            control={
                <Switch
                    checked={autoDispatch}
                    onChange={onChange}
                    name="autoDispatch"
                    color="primary"
                />
            }
        label={t('auto_dispatch')}
      />
    )
}

export const BookingImageSettings = (props) => {
    return null;
}

export const carTypeColumns = (t, isRTL, onClick) =>  [
    { title: t('name'), field: 'name', cellStyle:isRTL ==='rtl'? {paddingRight:100 , textAlign: 'right' }:{ paddingLeft: 100}, headerStyle:isRTL==='rtl'?{paddingRight:100}:{ paddingLeft: 100}},
    { title: t('image'),  field: 'image',cellStyle:{ textAlign: 'center'},
      initialEditValue: 'https://cdn.pixabay.com/photo/2012/04/15/22/09/car-35502__480.png',
      render: rowData => rowData.image? <button onClick={()=>{onClick(rowData)}}><img alt='CarImage' src={rowData.image} style={{width: 50}}/></button>:null
    },
    { title: t('base_fare'), field: 'base_fare', type: 'numeric', cellStyle:{ textAlign: 'center'}, initialEditValue: 0 },
    { title: t('rate_per_unit_distance'), field: 'rate_per_unit_distance', type: 'numeric', cellStyle:{ textAlign: 'center'}, initialEditValue: 0},
    { title: t('rate_per_hour'), field: 'rate_per_hour', type: 'numeric', cellStyle:{ textAlign: 'center'}, initialEditValue: 0},
    { title: t('min_fare'), field: 'min_fare', type: 'numeric', cellStyle:{ textAlign: 'center'}, initialEditValue: 0},
    { title: t('convenience_fee'), field: 'convenience_fees', type: 'numeric', cellStyle:{ textAlign: 'center'}, initialEditValue: 0},
    {
      title: t('convenience_fee_type'),
      field: 'convenience_fee_type',
      lookup: { flat: t('flat'), percentage: t('percentage')},
      cellStyle:{ textAlign: 'center'}
    },
    { title: t('extra_info'), field: 'extra_info' , cellStyle:{ textAlign:isRTL ==='rtl'? 'right' : 'left'}},
    { title: t('position'), field: 'pos', type: 'numeric'}
];

export const acceptBid = (selectedBooking, selectedBidder) => {
    return null;
}

export const BidModal = (props) => {
    return null
}

export const  downloadCsv = (data, fileName) => {
    const finalFileName = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "text/csv" }));
    a.setAttribute("download", finalFileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}