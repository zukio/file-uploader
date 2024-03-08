// ============================================
// option.js
// --------------------------------------------
const apiep = "";
const headers = {
  Authorization: "", // 'Baser'ではなく'Bearer'が正しい認証スキーム
  Accept: ["*/*"],
  ProjectId: ""
};
// JsonEditor の編集ウィンドウの設定
const userConfig = {
  windowConfig: {
    fullscreen: false,
    width: 800,
    height: 800,
    x: 0, // 画面の左端
    y: 0, // 画面の上端
    webPreferences: {
      devTools: false,
      nodeIntegration: true
    },
    frame: true,
    titleBarStyle: "visible",
    minimizable: false, // 最小化ボタンを無効化
    alwaysOnTop: true, // 最前面に表示
    show: true,
    menu: false
  },
  ignoreMouseEvents: false
};
