/* eslint-disable no-unused-vars */
import 'i18n-js';
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock';

jest.mock('i18n-js', () => ({
  I18n: () => {
    return {
      t: jest.fn((str) => str),
    };
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-permissions', () => ({
  check: (_) => Promise.resolve(true),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock('react-native-fs', () => {
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});

jest.mock('sp-react-native-in-app-updates', () => ({
  check: (_) => Promise.resolve(true),
}));

jest.mock('react-native-device-info', () => mockRNDeviceInfo);

jest.mock('react-native-config', () => {
  return {
    API_CLIENT_CODE: 2,
    API_BASE_URL: 'https://v2.dev.api.fairfood.org/connect/v1/',
    APP_ENVIRONMENT: 'development',
    API_SERVER_NAME: 'Connect',
    SENTRY_URL:
      'https://c32822bcad544ad4b76ffd5a03db0a0c@o1261458.ingest.sentry.io/6565145',
    APP_LINK_REDIRECT_URI: 'connect://harvest.app',
    GOOGLE_PLAY_STORE_URL:
      'http://play.google.com/store/apps/details?id=com.fairfood_collector',
  };
});

// Mock the Realm
jest.mock('../../src/db/Configuration', () => {
  return {
    reInitRealm: jest.fn(),
    realm: jest.fn(),
  };
});

jest.mock('@react-native-firebase/analytics', () => {
  return {
    logEvent: jest.fn(),
  };
});

const mockCrashlytics = {
  setAttributes: jest.fn(),
  recordError: jest.fn(),
};

const crashlyticsMock = () => mockCrashlytics;

jest.mock('@react-native-firebase/crashlytics', () => crashlyticsMock);

jest.mock('react-native-tts', () => {
  return {
    setDefaultLanguage: jest.fn(),
    speak: jest.fn(),
  };
});

jest.mock('@sentry/react-native', () => {
  return {
    captureException: jest.fn(),
    captureUserFeedback: jest.fn(),
  };
});

// Mock the redux
jest.mock('../../src/redux/store', () => {
  return {
    store: jest.fn(),
  };
});

jest.mock('../../src/utils/commonFunctions', () => ({
  NumberFormatter: {
    currency: jest.fn((str) => str),
    quantity: jest.fn((str) => str),
    numberToFormat: jest.fn((str) => str),
    formatToNumber: jest.fn((str) => str),
  },
}));
