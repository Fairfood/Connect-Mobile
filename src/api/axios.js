import axios from 'axios';

const instance = axios.create({
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return error.response;
    },
);

export default instance;
