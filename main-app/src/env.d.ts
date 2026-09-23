/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'mainApp/CommonNavbar';
declare module 'mainApp/CommonButton';
declare module 'mainApp/CommonModal';
declare module 'mainApp/utils';
declare module 'subMall/MallPage';
declare module 'subActivity/ActivityPage';
declare module 'subUser/UserPage';
