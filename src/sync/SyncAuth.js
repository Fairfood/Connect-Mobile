import { Alert, Linking } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import pkceChallenge from 'react-native-pkce-challenge';
import DeviceInfo from 'react-native-device-info';
import base64 from 'react-native-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Middleware } from '../api/middleware';
import { updateSyncStage } from '../redux/SyncStore';
import { handleErrors, manageUserDatabase } from '../utils/commonFunctions';
import {
  signInSuccess,
  signOutUser,
  updateLoginLoadingStatus,
  updateUserDetails,
} from '../redux/LoginStore';
import { store } from '../redux/store';
import I18n from '../translations/text/i18n';
import axios from '../api/axios';

/**
 * login api
 * @param   {string}  email       user email
 * @param   {string}  password    user password
 * @param   {boolean} forceLogout need a new access token or not
 * @returns {object}              user object
 */
export const userLogin = async (email, password, forceLogout = false) => {
  try {
    const [deviceId, deviceName] = await Promise.all([
      DeviceInfo.getUniqueId(),
      DeviceInfo.getDeviceName(),
    ]);

    const data = {
      username: email,
      password,
      force_logout: forceLogout,
      device_id: deviceId.toString(),
      device_name: deviceName,
    };

    const config = {
      method: 'POST',
      urlKey: 'auth/login/',
      contentType: 'application/json',
      authorized: false,
      data,
    };

    const response = await Middleware(config);

    if (response.success) {
      const user = response.data;
      await manageUserDatabase(user);
      return [user, null];
    }

    return [null, response.error];
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_userLogin',
    });
    return [null, I18n.t('something_went_wrong')];
  }
};

/**
 * fetches user details
 * @param   {object} user user object
 * @returns {void}
 */
export const fetchUserDetails = async (user) => {
  try {
    const config = {
      method: 'GET',
      urlKey: `accounts/users/${user.user_id}/`,
      contentType: 'application/json',
      user,
    };

    const response = await Middleware(config);

    if (response.success) {
      const userDetails = response.data;
      const finalUserObj = {
        ...user,
        ...userDetails,
      };

      const { syncStage } = store.getState().sync;
      if (syncStage === 0) {
        store.dispatch(updateSyncStage(1));
      }

      // updating user login and loggedInUser
      store.dispatch(signInSuccess(finalUserObj));
      return [true, null];
    }
    return [null, 'Error in user details fetch.'];
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_fetchUserDetails',
    });
    return [null, I18n.t('something_went_wrong')];
  }
};

const handleAlert = () => {
  store.dispatch(signOutUser());
};

/**
 * fetching new access token
 * @param   {object}  prevConfig  previous api config
 * @returns {boolean}             success status
 */
export const fetchAccessToken = async (prevConfig = null) => {
  try {
    const { loggedInUser, isLoggedIn } = store.getState().login;
    const { apiConfig } = store.getState().connection;

    const headers = {
      'Content-Type': 'application/json',
      Version: DeviceInfo.getVersion(),
      'Client-Code': apiConfig.API_CLIENT_CODE,
    };

    const data = {
      refresh: loggedInUser.refresh,
      entity: loggedInUser.entity_id,
    };

    const config = {
      method: 'POST',
      url: `${apiConfig.API_BASE_URL}auth/token/refresh/`,
      headers,
      data: JSON.stringify(data),
    };

    const response = await axios(config);

    if (response?.data?.success === true) {
      const user = response.data.data;
      store.dispatch(updateUserDetails(user));

      if (prevConfig) {
        const access = user?.access ?? '';
        prevConfig.headers.Authorization = `Bearer ${access}`;

        const result = await Middleware(prevConfig);
        return result;
      }
      return { success: true, error: null };
    }

    if (isLoggedIn) {
      Alert.alert(I18n.t('session_expired'), I18n.t('session_expired_msg'), [
        {
          text: I18n.t('ok'),
          onPress: handleAlert,
        },
      ]);

      const fetchAccessError = new Error('Fetching access token failed.');
      handleErrors(fetchAccessError, {
        ref: 'SyncAuth_fetchAccessToken',
        response: JSON.stringify(response.data),
      });

      return { success: false, error: 'Fetching access token failed.' };
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_fetchAccessToken',
    });
    return { success: false, error: 'Fetching access token failed.' };
  }
};

/**
 * logout api
 * @param {object | null} currentUser current user details
 */
export const userLogout = async (currentUser = null) => {
  try {
    const { isConnected } = store.getState().connection;

    if (isConnected) {
      const config = {
        method: 'POST',
        urlKey: 'auth/logout/',
        contentType: 'application/json',
        user: currentUser,
      };

      await Middleware(config);

      const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');
      const { loggedInUser } = store.getState().login;

      if (sso) {
        await store.dispatch(updateLoginLoadingStatus(true, 'redirecting'));
        await revokeRefreshToken({ ...loggedInUser });
        await authenticateSSOUser(sso);
        store.dispatch(signOutUser());
      } else {
        store.dispatch(signOutUser());
      }
    } else {
      store.dispatch(signOutUser());
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_userLogout',
    });
  }
};

export const serverHandshake = async () => {
  try {
    const nonce = uuidv4();

    const data = {
      device_id: await DeviceInfo.getUniqueId(),
      type: 101, // android
      version: DeviceInfo.getVersion(),
      nonce,
    };

    const config = {
      method: 'POST',
      urlKey: 'auth/handshake/',
      testingKey: '_server_handshake',
      contentType: 'application/json',
      authorized: false,
      data,
    };

    const response = await Middleware(config);
    if (response.success) {
      return [{ ...response.data, client_nonce: nonce }, null];
    }

    return [null, response.error];
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_serverHandshake',
    });
  }
};

export const authenticateSSOUser = async (result) => {
  try {
    const { apiConfig } = store.getState().connection;
    const sso = result.authentication_method;
    const challenge = pkceChallenge();
    await AsyncStorage.setItem('sso_challenge', JSON.stringify(challenge));
    const authUrl = `${sso.sso_login_url}?response_type=${sso.response_type}&app_type=${sso.app_type}&code_challenge_method=${sso.code_challenge_method}&client_id=${sso.client_id}&redirect_uri=${apiConfig.APP_LINK_REDIRECT_URI}&code_challenge=${challenge.codeChallenge}`;

    const base64Value = base64.encode(authUrl);
    const logoutUrl = `${sso.sso_logout_url}?redirect=${base64Value}`;
    
    setTimeout(() => {
      Linking.openURL(logoutUrl);
    }, 1000);
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_authenticateSSOUser',
    });
  }
};

export const getSSOToken = async (code) => {
  try {
    const { apiConfig } = store.getState().connection;
    const challenge = JSON.parse(await AsyncStorage.getItem('sso_challenge'));
    const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');
    const data = `code=${code}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(
      apiConfig.APP_LINK_REDIRECT_URI,
    )}&client_id=${sso.authentication_method.client_id}&code_verifier=${
      challenge.codeVerifier
    }`;

    const config = {
      method: 'POST',
      url: sso.authentication_method.sso_token_url,
      contentType: 'application/x-www-form-urlencoded',
      authorized: false,
      data,
    };

    const response = await Middleware(config);
    if (response.success) {
      return [response.data, null];
    }

    return [null, response.error];
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_getSSOToken',
    });
  }
};

export const deviceRegistration = async (tokenData, forceLogout) => {
  try {
    const data = {
      device_id: await DeviceInfo.getUniqueId(),
      type: 101, // android
      version: DeviceInfo.getVersion(),
      device_name: await DeviceInfo.getDeviceName(),
      force_logout: forceLogout,
    };

    const config = {
      method: 'POST',
      urlKey: 'auth/device/registration/',
      contentType: 'application/json',
      data,
      user: tokenData,
    };

    const response = await Middleware(config);
    if (response.success) {
      return [response.data, null];
    }

    return [null, response.error];
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_getToken',
    });
  }
};

/**
 * fetching new access token
 * @param   {object}  prevConfig  previous api config
 * @returns {boolean}             success status
 */
export const fetchIdToken = async (prevConfig = null) => {
  try {
    const { loggedInUser, isLoggedIn } = store.getState().login;
    const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Version: DeviceInfo.getVersion(),
    };

    const data = `client_id=${sso.authentication_method.client_id}&refresh_token=${loggedInUser.refresh_token}&grant_type=refresh_token`;

    const config = {
      method: 'POST',
      url: sso.authentication_method.sso_token_url,
      headers,
      data,
    };

    const response = await axios(config);
    if (response?.status === 200) {
      const user = response.data;
      store.dispatch(updateUserDetails(user));

      if (prevConfig) {
        const token = user?.id_token ?? '';
        prevConfig.headers.Authorization = `Bearer ${token}`;

        const result = await Middleware(prevConfig);
        return result;
      }
      return { success: true, error: null };
    }

    if (isLoggedIn) {
      Alert.alert(I18n.t('session_expired'), I18n.t('session_expired_msg'), [
        {
          text: I18n.t('ok'),
          onPress: handleAlert,
        },
      ]);

      const fetchAccessError = new Error('Fetching id token failed.');
      handleErrors(fetchAccessError, {
        ref: 'SyncAuth_fetchAccessToken',
        response: JSON.stringify(response.data),
      });

      return { success: false, error: 'Fetching id token failed.' };
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_fetchAccessToken',
    });
    return { success: false, error: 'Fetching access token failed.' };
  }
};

export const revokeRefreshToken = async (loggedInUser) => {
  try {
    const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Version: DeviceInfo.getVersion(),
    };

    const data = `token=${loggedInUser.refresh_token}&client_id=${sso.authentication_method.client_id}`;
    const fetchUrl = sso.authentication_method.sso_token_url.replace(
      'token/',
      'revoke_token/',
    );

    const config = {
      method: 'POST',
      url: fetchUrl,
      headers,
      data,
    };

    await axios(config);
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncAuth_fetchAccessToken',
    });
    return { success: false, error: 'Fetching access token failed.' };
  }
};
