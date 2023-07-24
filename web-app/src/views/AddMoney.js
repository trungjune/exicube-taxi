import React, { useState, useEffect } from 'react';
import {
    Grid,
    Typography,
    TextField,
} from '@mui/material';
import { useSelector, useDispatch } from "react-redux";
import AlertDialog from '../components/AlertDialog';
import { makeStyles } from '@mui/styles';
import UsersCombo from '../components/UsersCombo';
import { api } from 'common';
import { useTranslation } from "react-i18next";
import {colors} from '../components/Theme/WebTheme';
import Button from "components/CustomButtons/Button.js";

const useStyles = makeStyles(theme => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
    '@global': {
        body: {
            backgroundColor: theme.palette.common.white,
        },
    },
    container: {
        width: '50%',
        marginTop: theme.spacing(1),
        backgroundColor: colors.Header,
        alignContent: 'center',
        borderRadius: "8px",
    },
    container1: {
        backgroundColor: colors.Header_Text,
        borderTopLeftRadius:"0px",
        borderTopRightRadius:"0px",
        borderBottomLeftRadius: "8px",
        borderBottomRightRadius: "8px",
        padding:'30px',
        width: '100%',
        top: "19px",
        boxShadow: "4px 4px 6px #9E9E9E"
    },
    title: {
        color: colors.Header_Text, 
        padding:'10px'
    },
    items: {
        margin: 0,
        width: '100%'
    },
    input: {
        fontSize: 18,
        color: "#000"
    },
    inputdimmed: {
        fontSize: 18,
        color: "#737373"
    },
    carphoto: {
        height: '18px',
        marginRight: '10px'
    },
    buttonStyle: {
        margin: 0,
        width: '100%',
        height: 40,
        borderRadius: "30px",
        backgroundColor: colors.Header,
        marginTop:'15px',
        color:'#FFF'
    },
    label: {
        transformOrigin: "top right",
        right: 0,
        left: "auto"
      }, 
    inputRtl: {
        "& label": {
          right: 20,
          left: "auto"
        },
        "& legend": {
          textAlign: "right"
        }
      }
}));

export default function AddMoney(props) {
    const { t, i18n  } = useTranslation();
    const isRTL = i18n.dir();
    const {
        addToWallet
    } = api;
    const settings = useSelector(state => state.settingsdata.settings);
    const dispatch = useDispatch();
    const classes = useStyles();
    const userdata = useSelector(state => state.usersdata);
    const [users, setUsers] = useState(null);
    const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
    const [userCombo, setUserCombo] = useState(null);
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        if (userdata.users) {
            let arr = [];
            for (let i = 0; i < userdata.users.length; i++) {
                let user = userdata.users[i];
                arr.push({
                    'firstName': user.firstName,
                    'lastName': user.lastName,
                    'mobile': user.mobile,
                    'email': user.email,
                    'uid': user.id,
                    'desc': user.firstName + ' ' + user.lastName + ' (' + (settings.AllowCriticalEditsAdmin? user.mobile : "Hidden") + ') ' + (settings.AllowCriticalEditsAdmin? user.email : "Hidden"),
                    'pushToken': user.pushToken ? user.pushToken : ''
                });
            }
            setUsers(arr);
        }
    }, [userdata.users,settings.AllowCriticalEditsAdmin]);

    const handleAddBalance = () => {
        if(userCombo && userCombo.uid && amount> 0){
            dispatch(addToWallet(userCombo.uid,amount));
            setCommonAlert({ open:true, msg: t('success')});
        }else{
            setCommonAlert({ open:true, msg: t('no_details_error')});
        }
    }

    const handleCommonAlertClose = (e) => {
        e.preventDefault();
        setCommonAlert({ open: false, msg: '' })
    };

    return (
        <div className={classes.container} style={{direction:isRTL==='rtl'?'rtl':'ltr'}}>
            <Grid item xs={12} sm={12} md={8} lg={8}>
                <Grid item >
                    <Grid item xs={12}>
                        <Typography component="h1" variant="h5" className={classes.title} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
                            {t('add_to_wallet')}
                        </Typography>
                    </Grid>
                    <div className={classes.container1}>
                        <Grid container spacing={2} >
                            <Grid item xs={12}>
                                {users ?
                                    <UsersCombo
                                        className={classes.items}
                                        placeholder={t('select_user')}
                                        users={users}
                                        value={userCombo}
                                        onChange={(event, newValue) => {
                                            setUserCombo(newValue);
                                        }}
                                        
                                    />
                                    : null}
                            </Grid>
                            <Grid item xs={12} sm={6} >
                                <TextField
                                    id="datetime-local"
                                    label={t('amount')}
                                    type="number"
                                    variant={"outlined"}
                                    fullWidth
                                    className={isRTL==='rtl'? classes.inputRtl:classes.commonInputStyle}
                                    InputProps={{
                                        className: classes.input
                                    }}
                                    value={amount}
                                    onChange={event => {
                                        const { value } = event.target;
                                        setAmount(value === '' || value === null || value === undefined? 0:parseFloat(value));
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} >
                                <Button
                                    size="lg"
                                    onClick={handleAddBalance}
                                    variant="contained"
                                    color="secondaryButton"
                                    className={classes.buttonStyle}
                                >
                                    {t('add_to_wallet')}
                                </Button>
                            </Grid>
                        </Grid>
                    </div>
                </Grid>
            </Grid>
            <AlertDialog open={commonAlert.open} onClose={handleCommonAlertClose}>{commonAlert.msg}</AlertDialog>
        </div>
    );
}