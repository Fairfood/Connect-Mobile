import * as Sentry from '@sentry/react-native';

const captureSentry = (type, error, extras = {}) => {
  // if (__DEV__) {
  //   console.log(error);
  // }

  if (type === 'message') {
    const newError = new Error(error);
    Sentry.captureException(newError, { extras });
    return;
  }

  Sentry.captureException(error, { extras });
};

export default captureSentry;
