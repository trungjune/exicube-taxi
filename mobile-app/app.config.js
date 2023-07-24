import { AppConfig } from './config/AppConfig';
import { GoogleMapApiConfig } from './config/GoogleMapApiConfig';

export default {
    name: AppConfig.app_name,
    description: AppConfig.app_description,
    owner: AppConfig.expo_owner,
    slug: AppConfig.expo_slug,
    privacy: "public",
    runtimeVersion: AppConfig.ios_app_version,
    platforms: [
        "ios",
        "android"
    ],
    androidStatusBar: {
        hidden: true,
        translucent: true
    },
    version: AppConfig.ios_app_version,
    orientation: "portrait",
    icon: "./assets/images/logo1024x1024.png",
    splash: {
        "image": "./assets/images/splash.png",
        "resizeMode":'cover',
        "backgroundColor": "#ffffff"
    },
    updates: {
        "fallbackToCacheTimeout": 0,
        "url": "https://u.expo.dev/" + AppConfig.expo_project_id,
    },
    extra: {
        eas: {
          projectId: AppConfig.expo_project_id
        }
    },
    assetBundlePatterns: [
        "**/*"
    ],
    packagerOpts: {
        config: "metro.config.js"
    },
    ios: {
        supportsTablet: true,
        usesAppleSignIn: true,
        bundleIdentifier: AppConfig.app_identifier,
        infoPlist: {
            "NSLocationAlwaysUsageDescription": "This app uses the always location access in the background for improved pickups and dropoffs, customer support and safety purpose.",
            "NSLocationAlwaysAndWhenInUseUsageDescription": "This app uses the always location access in the background for improved pickups and dropoffs, customer support and safety purpose.",
            "NSLocationWhenInUseUsageDescription": "For a reliable ride, App collects location data from the time you open the app until a trip ends. This improves pickups, support, and more.",
            "NSCameraUsageDescription": "This app uses the camera to take your profile picture.",
            "NSPhotoLibraryUsageDescription": "This app uses Photo Library for uploading your profile picture.",
            "ITSAppUsesNonExemptEncryption":false,
            "UIBackgroundModes": [
                "location",
                "fetch"
            ]
        },
        config: {
            googleMapsApiKey: GoogleMapApiConfig.ios
        },
        googleServicesFile: "./GoogleService-Info.plist",
        buildNumber: AppConfig.ios_app_version
    },
    android: {
        package: AppConfig.app_identifier,
        versionCode: AppConfig.android_app_version,
        permissions: [
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE",
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "CAMERA_ROLL",
            "FOREGROUND_SERVICE",
            "ACCESS_BACKGROUND_LOCATION",
            "SCHEDULE_EXACT_ALARM"
        ],
        googleServicesFile: "./google-services.json",
        config: {
            googleMaps: {
                apiKey: GoogleMapApiConfig.android
            }
        }
    },
    plugins: [
        "@react-native-firebase/app", "@react-native-firebase/auth",
        ["./react-native-maps-plugin",'custom'],
        [
            "react-native-fbsdk-next",
            {
                appID: AppConfig.facebookAppId,
                clientToken: AppConfig.facebookClientToken,
                displayName: AppConfig.app_name,
                isAutoInitEnabled:true,
                iosUserTrackingPermission: false
            }
        ],
        [
            "expo-notifications",
            {
                sounds: [
                    "./assets/sounds/horn.wav",
                    "./assets/sounds/repeat.wav"
                ]
            }
        ],
        [
            "expo-build-properties",
            {
              "ios": {
                "useFrameworks": "static"
              }
            }
        ],
        [
            "expo-image-picker",
            {
              "photosPermission": "This app uses Photo Library for uploading your profile picture.",
              "cameraPermission": "This app uses the camera to take your profile picture."
            }
        ]
    ]   
}
