import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import Tts from 'react-native-tts';
import * as Sentry from '@sentry/react-native';
import { handleErrors } from './commonFunctions';

/**
 * Text-to-Speech functionality, speaking texts.
 * @param {string} text speech text
 */
export const textToSpeech = async (text) => {
  try {
    Tts.getInitStatus().then(() => {
      Tts.stop();
      Tts.speak(text, {
        androidParams: {
          KEY_PARAM_PAN: -1,
          KEY_PARAM_VOLUME: 1,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
      });
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'serviceHelper_textToSpeech',
    });
  }
};

/**
 * capturing error on Sentry
 * @param {error}  error  error captured
 * @param {object} extras custom data object
 */
export const captureSentry = async (error, extras = null) => {
  if (!global.__DEV__) {
    const sentryId = await Sentry.captureException(error);

    if (extras && sentryId) {
      Sentry.captureUserFeedback({ ...extras, event_id: sentryId });
    }
  }
};

/**
 * Recording firebase crashlytics
 * @param {string} error  event key
 * @param {object} extras event values
 */
export const recordCrashlytics = async (error, extras = {}) => {
  crashlytics().setAttributes(extras);
  crashlytics().recordError(error, extras?.ref ?? '');
};

/**
 * Logging firebase analytics
 * @param {string} key  event key
 * @param {object} data event values
 */
export const logAnalytics = async (key, data = {}) => {
  await analytics().logEvent(key, data);
};
