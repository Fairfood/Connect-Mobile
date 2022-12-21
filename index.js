import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// import BackgroundFetch from "react-native-background-fetch";

// let BackgroundFetchHeadlessTask = async (event) => {
//   BackgroundFetch.finish();
// };

// BackgroundFetch.registerHeadlessTask(BackgroundFetchHeadlessTask);

AppRegistry.registerComponent(appName, () => App);
