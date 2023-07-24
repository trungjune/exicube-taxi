import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from "./views/LandingPage.js";
import LoginPage from "./views/LoginPage.js";
import PrivacyPolicy from "./views/PrivacyPolicy.js";
import AboutUs from "./views/AboutUs";
import AuthLoading from './views/AuthLoading';
import { Provider } from "react-redux";
import ProtectedRoute from './views/ProtectedRoute';
import MyProfile from './views/MyProfile';
import BookingHistory from './views/BookingHistory';
import Dashboard from './views/Dashboard';
import CarTypes from './views/CarTypes';
import AddBookings from './views/AddBookings';
import Promos from './views/Promos';
import Users from './views/Users';
import Notifications from './views/Notifications';
import Settings from './views/Settings.js';
import CancellationReasons from './views/CancellationReasons';
import AddMoney from "./views/AddMoney";
import Withdraws from './views/Withdraws';
import AllReports from "./views/AllReports";
import { FirebaseProvider, store } from "common";
import { FirebaseConfig } from './config/FirebaseConfig';
import { GoogleMapApiConfig } from './config/GoogleMapApiConfig';
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ContactUs from "./views/ContactUs";
import UserWallet from "./views/UserWallet";
import CarsList from "./views/CarsList";
import {ThemeProvider} from '@mui/styles';
import {createTheme} from '@mui/material';
import { useJsApiLoader } from '@react-google-maps/api';
import TermCondition from "views/TermCondition.js";

const libraries = ['geometry','drawing','places'];

i18n
.use(initReactI18next) 
.init({
    resources: {},
    fallbackLng: "en",
    ns: ["translations"],
    defaultNS: "translations",
    interpolation: {
        escapeValue: false
    }
});

function App() {

  useJsApiLoader({
    id: 'google-map',
    googleMapsApiKey: GoogleMapApiConfig,
    libraries
  })

  const theme = createTheme()

  return (
    <Provider store={store}>
      <FirebaseProvider config={FirebaseConfig}>
        <ThemeProvider theme={theme}>
          <AuthLoading>
           <BrowserRouter>
              <Routes>
                <Route path="/dashboard" element={<ProtectedRoute permit={"admin,fleetadmin"}><Dashboard /></ProtectedRoute>}/>
                <Route path="/bookings" element={<ProtectedRoute permit={"customer,admin,driver,fleetadmin"}><BookingHistory /></ProtectedRoute>}/>
                <Route path="/profile" element={<ProtectedRoute permit={"customer,admin,driver,fleetadmin"}><MyProfile /></ProtectedRoute>}/>
                <Route path="/cartypes" element={<ProtectedRoute permit={"admin"}><CarTypes /></ProtectedRoute>}/>
                <Route path="/cars" element={<ProtectedRoute permit={"admin,fleetadmin,driver"}><CarsList /></ProtectedRoute>}/>
                <Route path="/cancelreasons" element={<ProtectedRoute permit={"admin"}><CancellationReasons /></ProtectedRoute>}/>
                <Route path="/addbookings" element={<ProtectedRoute permit={"admin,fleetadmin,customer"}><AddBookings /></ProtectedRoute>}/>
                <Route path="/promos" element={<ProtectedRoute permit={"admin"}><Promos /></ProtectedRoute>}/>
                <Route path="/users" element={<ProtectedRoute permit={"admin,fleetadmin"}><Users /></ProtectedRoute>}/>
                <Route path="/notifications" element={<ProtectedRoute permit={"admin"}><Notifications /></ProtectedRoute>}/>
                <Route path="/addtowallet" element={<ProtectedRoute permit={"admin"}><AddMoney /></ProtectedRoute>}/>
                <Route path="/userwallet" element={<ProtectedRoute permit={"customer,driver"}><UserWallet /></ProtectedRoute>}/>
                <Route path="/withdraws" element={<ProtectedRoute permit={"admin"}><Withdraws /></ProtectedRoute>}/>
                <Route path="/allreports" element={<ProtectedRoute permit={"admin,fleetadmin"}><AllReports /></ProtectedRoute>}/>
                <Route path="/settings" element={<ProtectedRoute permit={"admin"}><Settings /></ProtectedRoute>}/>
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/term-condition" element={<TermCondition />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<LandingPage />} />
              </Routes>
            </BrowserRouter>
          </AuthLoading>
        </ThemeProvider>
      </FirebaseProvider>
    </Provider>
  );
}

export default App;