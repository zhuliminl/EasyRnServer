/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import SubApp from './src/subApp';

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerComponent('rn_sub_1', () => SubApp);

// AppRegistry.unmountApplicationComponentAtRootTag(rootTag => {
//   console.log('saul >>>>>>>>>   离开APP', rootTag);
// });

const appKeys = AppRegistry.getAppKeys();
console.log('saul APPKEYS', appKeys);
