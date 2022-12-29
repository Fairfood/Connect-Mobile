import DeviceInfo from 'react-native-device-info';
import axios from 'axios';
import api from '../../src/api/config';

const LoginUser = async (email, password, forceLogout = false) => {
  // let device_id = await DeviceInfo.getDeviceId()
  // let device_name = await DeviceInfo.getDeviceName()
  const timestamp = Math.round(new Date() / 1000);

  const data = {
    username: email,
    password,
    device_id: (1234567890).toString(),
    type: '1',
    force_logout: forceLogout,
    registration_id: timestamp.toString(),
    name: 'Redmi note 8 pro',
  };

  const config = {
    method: 'post',
    url: `${api.API_URL}${api.API_VERSION}/projects/login/`,
    headers: {
      'Content-Type': 'application/json',
      Version: DeviceInfo.getVersion(),
      'Client-Code': api.API_CLIENT_CODE,
    },
    data: JSON.stringify(data),
  };

  return axios(config)
    .then((res) => res.data)
    .then(() => {
    //   console.log('response', response);
      return true;
    })
    .catch(() => {
      return false;
    });
};

export default LoginUser;
