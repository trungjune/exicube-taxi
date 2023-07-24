import base64 from 'react-native-base64';
import { firebase } from '../config/configureFirebase';
import AccessKey from './AccessKey';

export const fetchPlacesAutocomplete = (searchKeyword) => {
    return new Promise((resolve,reject)=>{
        const { config } = firebase;
        fetch(`https://${config.projectId}.web.app/googleapis-autocomplete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
            },
            body: JSON.stringify({
                "searchKeyword": searchKeyword
            })
        }).then(response => {
            return response.json();
        })
        .then(json => {
            if(json && json.searchResults) {
                resolve(json.searchResults);
            }else{
                reject(json.error);
            }
        }).catch(error=>{
            console.log(error);
            reject("fetchPlacesAutocomplete Call Error")
        })
    });
}

export const fetchCoordsfromPlace = (place_id) => {
    return new Promise((resolve,reject)=>{
        const { config } = firebase;
        fetch(`https://${config.projectId}.web.app/googleapis-getcoords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
            },
            body: JSON.stringify({
                "place_id": place_id
            })
        }).then(response => {
            return response.json();
        })
        .then(json => {
            if(json && json.coords) {
                resolve(json.coords);
            }else{
                reject(json.error);
            }
        }).catch(error=>{
            console.log(error);
            reject("fetchCoordsfromPlace Call Error")
        })
    });
}


export const fetchAddressfromCoords = (latlng) => {
    return new Promise((resolve,reject)=>{
        const { config } = firebase;
        fetch(`https://${config.projectId}.web.app/googleapis-getaddress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
            },
            body: JSON.stringify({
                "latlng": latlng
            })
        }).then(response => {
            return response.json();
        })
        .then(json => {
            if(json && json.address) {
                resolve(json.address);
            }else{
                reject(json.error);
            }
        }).catch(error=>{
            console.log(error);
            reject("fetchAddressfromCoords Call Error")
        })
    });
}

export const getDistanceMatrix = (startLoc, destLoc) => {
    return new Promise((resolve,reject)=>{
        const { config } = firebase;
        fetch(`https://${config.projectId}.web.app/googleapis-getdistancematrix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
            },
            body: JSON.stringify({
                "start": startLoc,
                "dest": destLoc
            })
        }).then(response => {
            return response.json();
        })
        .then(json => {
            if(json.error){
                console.log(json.error);
                reject(json.error);
            }else{
                resolve(json);
            }
        }).catch(error=>{
            console.log(error);
            reject("getDistanceMatrix Call Error")
        })
    });
}

export const getDirectionsApi = (startLoc, destLoc, waypoints) => {
    return new Promise((resolve,reject)=>{
        const { config } = firebase;
        const body = {
            "start": startLoc,
            "dest": destLoc
        };
        if(waypoints){
            body["waypoints"] = waypoints;
        }
        fetch(`https://${config.projectId}.web.app/googleapis-getdirections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
            },
            body: JSON.stringify(body)
        }).then(response => {
            return response.json();
        })
        .then(json => {
            if (json.hasOwnProperty('distance_in_km')) {
                resolve(json);
            }else{
                console.log(json.error);
                reject(json.error);
            }
        }).catch(error=>{
            console.log(error);
            reject("getDirectionsApi Call Error")
        })
    });
}

