import {
  FETCH_USER,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILED,
  USER_SIGN_IN,
  USER_SIGN_IN_FAILED,
  USER_SIGN_OUT,
  CLEAR_LOGIN_ERROR,
  REQUEST_OTP_SUCCESS,
  UPDATE_USER_WALLET_HISTORY,
  SEND_RESET_EMAIL,
  SEND_RESET_EMAIL_FAILED
} from "../store/types";

import store from '../store/store';
import { firebase } from '../config/configureFirebase';
import { onValue, update, set, off } from "firebase/database";
import { onAuthStateChanged, signInWithCredential, signInWithPopup, signOut, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { uploadBytesResumable, getDownloadURL } from "firebase/storage";
import base64 from 'react-native-base64';
import AccessKey from '../other/AccessKey';

export const fetchUser = () => (dispatch) => {
  const {
    auth,
    singleUserRef
  } = firebase;

  dispatch({
    type: FETCH_USER,
    payload: null
  });
  onAuthStateChanged(auth, user => {
    if (user) {
      onValue(singleUserRef(user.uid), async snapshot => {
        if (snapshot.val()) {
          let profile = snapshot.val();
          profile.uid = user.uid;
          dispatch({
            type: FETCH_USER_SUCCESS,
            payload: profile
          });
        }else{
          let mobile = '';
          let email =  '';
          let firstName = '';
          let lastName = '';
          let verifyId = '';
          let profile_image = null;
          if(user.providerData.length == 0 && user.email){
            email = user.email;
          }
          if(user.providerData.length > 0 && user.phoneNumber){
            mobile = user.phoneNumber;
          }
          if (user.providerData.length > 0) {
            const provideData = user.providerData[0];
            if (provideData == 'phone') {
              mobile = provideData.phoneNumber;
            }
            if (provideData.providerId == 'facebook.com' || provideData.providerId == 'apple.com') {
              if (provideData.email) {
                email = provideData.email;
              }
              if (provideData.phoneNumber) {
                mobile = provideData.phoneNumber;
              }
              if (provideData.displayName) {
                if (provideData.displayName.split(" ").length > 0) {
                  firstName = provideData.displayName.split(" ")[0];
                  lastName = provideData.displayName.split(" ")[1];
                } else {
                  firstName = provideData.displayName;
                }
              }
              if (provideData.photoURL) {
                profile_image = provideData.photoURL;
              }
            }
          }

          if(user.providerData.length > 0 && user.verifyId){
            verifyId = user.verifyId;
          }

          const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
          const reference = [...Array(5)].map(_ => c[~~(Math.random()*c.length)]).join('');
          let userData = {
            createdAt: new Date().getTime(),
            firstName: firstName,
            lastName: lastName,
            mobile: mobile,
            email: email,
            usertype: 'customer',
            referralId: reference,
            approved: true,
            walletBalance: 0,
            verifyId: verifyId
          }
          if(profile_image){
            userData['profile_image'] = profile_image;
          }
          set(singleUserRef(user.uid), userData);
          userData.uid = user.uid;
          dispatch({
            type: FETCH_USER_SUCCESS,
            payload: userData
          });
        }
      });
    } else {
      dispatch({
        type: FETCH_USER_FAILED,
        payload: { code: store.getState().languagedata.defaultLanguage.auth_error, message: store.getState().languagedata.defaultLanguage.not_logged_in }
      });
    }
  });
};

export const validateReferer = async (referralId) => {
  const {
    config
  } = firebase;
  const response = await fetch(`https://${config.projectId}.web.app/validate_referrer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      referralId: referralId
    })
  })
  const json = await response.json();
  return json;
};

export const checkUserExists = async (data) => {
  const {
    config
  } = firebase;

  const settings = store.getState().settingsdata.settings;
  let host = window && window.location && settings.CompanyWebsite === window.location.origin? window.location.origin : `https://${config.projectId}.web.app`
  let url = `${host}/check_user_exists`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
    },
    body: JSON.stringify({
      email: data.email,
      mobile: data.mobile
    })
  })
  const json = await response.json();
  return json;
};

export const mainSignUp = async (regData) => {
  const {
    config
  } = firebase;
  let url = `https://${config.projectId}.web.app/user_signup`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ regData: regData })
  })
  const res = await response.json();
  return res;
};

export const updateProfileWithEmail = (profileData) => async (dispatch) => {
  const {
    config
  } = firebase;
  try{
    const settings = store.getState().settingsdata.settings;
    let host = window && window.location && settings.CompanyWebsite === window.location.origin? window.location.origin : `https://${config.projectId}.web.app`
    let url = `${host}/update_user_email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
      },
      body: JSON.stringify(profileData)
    })
    const result = await response.json();
    if(result.error){ 
      return {success: false, error: result.error}
    }
  }catch(error){
    return {success: false, error: error}
  }
}


export const requestPhoneOtpDevice = (verificationId) => async (dispatch) => {
    dispatch({
      type: REQUEST_OTP_SUCCESS,
      payload: verificationId
    }); 
}

export const mobileSignIn = (verficationId, code) => (dispatch) => {
  const {
    auth,
    mobileAuthCredential,
  } = firebase;

  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  signInWithCredential(auth, mobileAuthCredential(verficationId, code))
    .then((user) => {
      //OnAuthStateChange takes care of Navigation
    }).catch(error => {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
};

export const saveAddresses = async (uid, location, name) => {
  const { singleUserRef } = firebase;
  onValue(child(singleUserRef(uid), "savedAddresses"), (savedAdd) => {
    if (savedAdd.val()) {
      let addresses = savedAdd.val();
      let didNotMatch = true;
      for (let key in addresses) {
        let entry = addresses[key];
        if (entry.name == name ) {
          didNotMatch = false;
          update(child(singleUserRef(uid),"savedAddresses/" + key),{
            description: location.add,
            lat: location.lat,
            lng: location.lng,
            count: 1,
            name: name
          });
          break;
        }
      }
      if (didNotMatch) {
        push(child(singleUserRef(uid),"savedAddresses"),{
          description: location.add,
          lat: location.lat,
          lng: location.lng,
          count: 1,
          name: name
        });
      }
    } else {
      push(child(singleUserRef(uid),"savedAddresses"),{
        description: location.add,
        lat: location.lat,
        lng: location.lng,
        count: 1,
        name: name
      });
    }
  }, {onlyOnce: true});
};

export const facebookSignIn = (token) => (dispatch) => {

  const {
    auth,
    facebookProvider,
    facebookCredential
  } = firebase;

  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  if (token) {
    const credential = facebookCredential(token);
    signInWithCredential(auth, credential)
      .then((user) => {
        //OnAuthStateChange takes care of Navigation
      })
      .catch(error => {
        dispatch({
          type: USER_SIGN_IN_FAILED,
          payload: error
        });
      }
      );
  } else {
    signInWithPopup(auth, facebookProvider).then(function (result) {
      var token = result.credential.accessToken;
      const credential = facebookCredentialFromResult(token);
      signInWithCredential(auth, credential)
        .then((user) => {
          //OnAuthStateChange takes care of Navigation
        })
        .catch(error => {
          dispatch({
            type: USER_SIGN_IN_FAILED,
            payload: error
          });
        }
        );
    }).catch(function (error) {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
  }
};

export const appleSignIn = (credentialData) => (dispatch) => {

  const {
    auth,
    appleProvider
  } = firebase;

  dispatch({
    type: USER_SIGN_IN,
    payload: null
  });
  if (credentialData) {
    const credential = appleProvider.credential(credentialData);
    signInWithCredential(auth, credential)
      .then((user) => {
        //OnAuthStateChange takes care of Navigation
      })
      .catch((error) => {
        dispatch({
          type: USER_SIGN_IN_FAILED,
          payload: error
        });
      });
  } else {
    signInWithPopup(auth, appleProvider).then(function (result) {
      signInWithCredential(auth, result.credential)
        .then((user) => {
        //OnAuthStateChange takes care of Navigation
        })
        .catch(error => {
          dispatch({
            type: USER_SIGN_IN_FAILED,
            payload: error
          });
        }
        );
    }).catch(function (error) {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
  }
};

export const signOff = () => (dispatch) => {

  const {
    auth,
    singleUserRef,
    walletHistoryRef,
    userNotificationsRef
  } = firebase;

  const uid = auth.currentUser.uid;

  off(singleUserRef(uid));
  off(walletHistoryRef(uid));
  off(userNotificationsRef(uid));

  onValue(singleUserRef(uid), snapshot => {
      if(snapshot.val()){
        const profile = snapshot.val();
        if (profile && profile.usertype === 'driver') {
          update(singleUserRef(uid), {driverActiveStatus:false});
        }
        setTimeout(()=>{
          signOut(auth)
          .then(() => {
            dispatch({
              type: USER_SIGN_OUT,
              payload: null
            });
          })
          .catch(error => {
      
          });
        },2000)
      }
  },{onlyOnce: true});
};

export const updateProfile = (updateData) => async (dispatch) => {

  const {
    auth,
    singleUserRef,
    driverDocsRef,
    driverDocsRefBack,
    verifyIdImageRef
  } = firebase;

  const uid = auth.currentUser.uid;
  
  if (updateData.licenseImage) {
    await uploadBytesResumable(driverDocsRef(uid), updateData.licenseImage);
    updateData.licenseImage = await getDownloadURL(driverDocsRef(uid));
  }
  if (updateData.licenseImageBack) {
    await uploadBytesResumable(driverDocsRefBack(uid),updateData.licenseImageBack);
    updateData.licenseImageBack = await getDownloadURL(driverDocsRefBack(uid));
  }
  if (updateData.verifyIdImage) {
    await uploadBytesResumable(verifyIdImageRef(uid), updateData.verifyIdImage);
    updateData.verifyIdImage = await getDownloadURL(verifyIdImageRef(uid));
  }

  update(singleUserRef(uid), updateData);
};


export const updateProfileImage = (imageBlob) => {

  const {
    auth,
    singleUserRef,
    profileImageRef,
  } = firebase;

  const uid = auth.currentUser.uid;

  uploadBytesResumable( profileImageRef(uid), imageBlob).then(() => {
    imageBlob.close()
    return getDownloadURL(profileImageRef(uid))
  }).then((url) => {
    update(singleUserRef(uid), {
      profile_image: url
    });
  })
};

export const updateWebProfileImage = async (imageBlob) => {

  const {
    auth,
    singleUserRef,
    profileImageRef
  } = firebase;

  const uid = auth.currentUser.uid;

  await uploadBytesResumable(profileImageRef(uid), imageBlob);
  let image = await getDownloadURL(profileImageRef(uid));
  update(singleUserRef(uid), {profile_image: image});

};

export const updatePushToken = (token, platform)  => {

  const {
    auth,
    singleUserRef,
  } = firebase;

  const uid = auth.currentUser.uid;

  update(singleUserRef(uid), {
    pushToken: token,
    userPlatform: platform
  });
};

export const clearLoginError = () => (dispatch) => {
  dispatch({
    type: CLEAR_LOGIN_ERROR,
    payload: null
  });
};

export const fetchWalletHistory = () => (dispatch) => {
  const {
    auth,
    walletHistoryRef
  } = firebase;

  const uid = auth.currentUser.uid;

  onValue(walletHistoryRef(uid) , snapshot => {
    const data = snapshot.val(); 
    if(data){
      const arr = Object.keys(data).map(i => {
        data[i].id = i
        return data[i]
      });
      dispatch({
        type: UPDATE_USER_WALLET_HISTORY,
        payload: arr.reverse()
      });
    }
  });
};

export const sendResetMail = (email) => async (dispatch) => {
  const {
    authRef
  } = firebase;

  dispatch({
    type: SEND_RESET_EMAIL,
    payload: email
  });
  sendPasswordResetEmail(authRef(), email).then(function() {
    console.log('Email send successfuly');
  }).catch(function (error) {
      dispatch({
        type: SEND_RESET_EMAIL_FAILED,
        payload: {code: store.getState().languagedata.defaultLanguage.auth_error, message: store.getState().languagedata.defaultLanguage.not_registred }
      });
  });
};

export const verifyEmailPassword = (email, pass) => async (dispatch) => {
  const {
    authRef
  } = firebase;

  signInWithEmailAndPassword(authRef(), email, pass)
    .then((user) => {
      //OnAuthStateChange takes care of Navigation
    })
    .catch((error) => {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error
      });
    });
}
