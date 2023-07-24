import React, {useState, useEffect} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CarIcon from '@mui/icons-material/DirectionsCar';
import ExitIcon from '@mui/icons-material/ExitToApp';
import OfferIcon from '@mui/icons-material/LocalOffer';
import NotifyIcon from '@mui/icons-material/NotificationsActive';
import { api } from 'common';
import { colors } from '../components/Theme/WebTheme';
import { useTranslation } from "react-i18next";
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MoneyIcon from '@mui/icons-material/Money';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import {calcEst, showEst, optionsRequired} from '../common/sharedFunctions';

const drawerWidth = 260;

export default function ResponsiveDrawer(props) {
  const { t, i18n  } = useTranslation();
  const isRTL = i18n.dir();
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const {
    signOff
  } = api;
  const auth = useSelector(state => state.auth);
  const settings = useSelector(state => state.settingsdata.settings);
  const dispatch = useDispatch();

  const LogOut = () => {
    dispatch(signOff());
  };

  const [role, setRole] = useState(null);

  useEffect(() => {
    if(auth.profile && auth.profile.usertype){
      setRole(auth.profile.usertype);
    }
  }, [auth.profile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div  style={{backgroundColor: colors.Header, height:'100%'}}>
      <div style={{ display: 'flex', backgroundColor: colors.Header, justifyContent:'center' }}>
        <img style={{ marginTop: '20px', marginBottom: '20px', width: '120px', height: '120px' }} src={require("../assets/img/logo192x192.png").default} alt="Logo" />
      </div>
      <div style={{ backgroundColor: colors.Header}}>
        {role ?
        <List disablePadding={true} dense={false}>
          {[
            {name : t('home'), url:'/', icon: <HomeIcon/>, access: ['admin','fleetadmin','driver','customer']},
            {name : t('dashboard_text'), url:'/dashboard', icon: <DashboardIcon/>, access: ['admin','fleetadmin']},
            {name : t('booking_history'), url:'/bookings', icon: <ViewListIcon/>, access: ['admin','fleetadmin','driver','customer']},
            {name : t('addbookinglable'), url:'/addbookings', icon: <ContactPhoneIcon/>, access: calcEst && !showEst && !optionsRequired ? ['customer'] : ['admin','fleetadmin','customer']},

            {name : t('user'), url:'/users', icon: <EmojiPeopleIcon />, access: ['admin','fleetadmin']},

            {name : t('car_type'), url:'/cartypes', icon: <CarIcon/>, access: ['admin']},
            {name : t('cars'), url:'/cars', icon: <CarIcon/>, access: ['admin','fleetadmin','driver']},

            {name : t('cancellation_reasons'), url:'/cancelreasons', icon: <CancelScheduleSendIcon />, access: ['admin']},
            
            {name : t('withdraws'), url:'/withdraws', icon: <MoneyIcon />, access: ['admin']},
            {name : t('add_to_wallet'), url:'/addtowallet', icon: <AccountBalanceWalletIcon />, access: ['admin']},
          
            {name : t('report'), url:'/allreports', icon: <AssessmentIcon />, access: ['admin','fleetadmin']},

            {name : t('settings_title'), url:'/settings', icon: <PhoneIphoneIcon />, access: ['admin']},

            {name : t('promo'), url:'/promos', icon: <OfferIcon />, access: ['admin']},
            {name : t('push_notification_title'), url:'/notifications', icon: <NotifyIcon />, access: ['admin']},

            {name : t('my_wallet_tile'), url:'/userwallet', icon: <AccountBalanceWalletIcon />, access: ['driver','customer']},
            {name : t('profile'), url:'/profile', icon: <AccountCircleIcon />, access: ['admin','fleetadmin','driver','customer']},
            {name : t('logout'), url:'logout', icon: <ExitIcon />, access: ['admin','fleetadmin','driver','customer']}
          ].map((item, index) => (
            item.access.includes(role)?
              <div style={{ display: 'flex',height: '50px'}} key={"key" + index}>
                <ListItem key={item} disableGutters={true} disablePadding={true} style={{paddingLeft:5,}} alignItems='center' dense={false}>
                  <ListItemButton disableGutters={true} dense={false} component={Link} to={item.url==='logout'? null : item.url} onClick={item.url==='logout'? LogOut : null}> 
                    <ListItemIcon style={{color: colors.Header_Text,}}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText inset={false} disableTypography={false} primary={item.name} style={{color: colors.Header_Text,textAlign:isRTL === 'rtl' ?'right':'left'}}/>
                  </ListItemButton>
                  <Divider />
                </ListItem>
              </div>
            :null
          ))}
        </List>
        : null }

      </div>
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex',direction:isRTL === 'rtl'? 'rtl':'ltr'}}>
      <CssBaseline />
      <AppBar
        position="fixed"
        style={isRTL=== 'rtl'? {marginRight:drawerWidth,backgroundColor: colors.Header,}:{marginLeft:drawerWidth,backgroundColor: colors.Header,}}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="#fff"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2,  display: { sm: 'none' }, }}
          >
            <MenuIcon style={{color:'#fff'}} />
          </IconButton>
          <Typography variant="h6" noWrap component="div" style={{color:'#fff'}}>
          {settings && settings.appName? settings.appName: '' }
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          anchor={isRTL === 'rtl' ? 'right' : 'left'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },direction:isRTL === 'rtl'? 'rtl':'ltr'
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          anchor={isRTL === 'rtl' ? 'right' : 'left'}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },direction:isRTL === 'rtl'? 'rtl':'ltr'
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar/>
        {props.children}
      </Box>
    </Box>
  );
}
