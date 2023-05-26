import moment from 'moment';
import { PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';

export function getCameraAssets(filterFunction) {
    return new Promise(async (resolve, reject) => {
        if (Platform.OS === "android") {
            const cameraPath = `${RNFS.ExternalStorageDirectoryPath}/DCIM/Camera`;
            try {
                const cameraFiles = await RNFS.readDir(cameraPath);

                resolve(cameraFiles.map(i => ({ ...i, timeStamp: convertTimeToTimeStamp(i.mtime) })).filter(filterFunction));
            } catch (error) {
                reject(error);
            }
        } else if (Platform.OS === "ios") {
            try {
                const photos = await RNFetchBlob.fs.ls('photos');
                const photosDetails = await Promise.all(
                    photos.map(async photo => ({
                        path: photo,
                        ...await RNFetchBlob.fs.stat(photo),
                    }))
                );
                resolve(photosDetails)
            } catch (error) {
                reject(error);
            }
        }
    })
}

export function requestPermission() {
    return new Promise((resolve, reject) => {
        if (Platform.OS === "android") {
            if (Platform.constants['Release'] >= 13) {
                PermissionsAndroid.requestMultiple(
                    [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]
                ).then((result) => {
                    if (result['android.permission.READ_MEDIA_IMAGES']
                        && result['android.permission.READ_MEDIA_VIDEO']
                        === 'granted') {
                        resolve(true)
                    } else if (result['android.permission.READ_MEDIA_IMAGES']
                        || result['android.permission.READ_MEDIA_VIDEO'] === 'never_ask_again') {
                        ToastAndroid.show('Please Go into Settings -> Applications -> APP_NAME -> Permissions and Allow permissions to continue');
                        resolve(false)
                    }
                });
            } else {
                PermissionsAndroid.requestMultiple(
                    [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]
                ).then((result) => {
                    if (result['android.permission.READ_EXTERNAL_STORAGE']
                        && result['android.permission.WRITE_EXTERNAL_STORAGE']
                        === 'granted') {
                        resolve(true)
                    } else if (result['android.permission.READ_EXTERNAL_STORAGE']
                        || result['android.permission.WRITE_EXTERNAL_STORAGE'] === 'never_ask_again') {
                        ToastAndroid.show('Please Go into Settings -> Applications -> APP_NAME -> Permissions and Allow permissions to continue');
                        resolve(false)
                    }
                });
            }
        }
        resolve(true)
    })
}

export function delay(time) {
    return new Promise((resolve) => {
        const tm = setTimeout(function () {
            clearTimeout(tm);
            resolve(null)
        }, time);
    })
}

export function convertTimeToTimeStamp(time) {
    return moment(time).valueOf();
}