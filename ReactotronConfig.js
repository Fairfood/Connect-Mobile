/* eslint-disable prefer-destructuring */
import Reactotron, {
  trackGlobalErrors,
  openInEditor,
  networking,
} from 'reactotron-react-native';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reactotronRedux } from 'reactotron-redux';

let scriptHostname;
if (__DEV__) {
  const { scriptURL } = NativeModules.SourceCode;
  scriptHostname = scriptURL.split('://')[1].split(':')[0];
}

/* AsyncStorage would either come from `react-native` or `@react-native-async-storage/async-storage`
depending on where you get it from */
const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  // .configure() // controls connection & communication settings
  .configure({ host: scriptHostname })
  .use(
    networking({
      ignoreContentTypes: /^(image)\/.*$/i,
      ignoreUrls: /\/(logs|symbolicate)$/,
    }),
  )
  .use(trackGlobalErrors())
  .use(openInEditor())
  .use(reactotronRedux())
  .useReactNative() // add all built-in react native plugins
  .connect(); // let's connect!

reactotron.useReactNative({
  asyncStorage: {
    ignore: ['secret'],
  },
  networking: {
    ignoreUrls: /symbolicate/,
  },
  editor: true,
  errors: { veto: () => false },
  overlay: true,
});
export default reactotron;
