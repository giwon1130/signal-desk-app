import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// 개발 미리보기는 명시적 플래그가 있어야 켜지고 배포 빌드에서는 항상 제외한다.
const RootComponent = __DEV__ && process.env.EXPO_PUBLIC_DESIGN_PREVIEW === '1'
  ? require('./src/dev/DesignPreview').default
  : App;
registerRootComponent(RootComponent);
