const { BrowserWindow, screen } = require("electron");

function getScreen() {
  let { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width: width, height: height };
}

// configのデフォルト値
let initialConfig = {
  fullscreen: false,
  width: 800,
  height: 800,
  webPreferences: {
    devTools: false,
  },
  titleBarStyle: "show-inactive",
  frame: true,
  show: true,
};

let ignoreMouseEvents = false;

// ユーザーの設定でデフォルトの設定を上書き
function overrideConfig(userConfig) {
  if (userConfig ?? null !== null) {
    if (Object.hasOwnProperty.call(userConfig, "windowConfig")) {
      initialConfig = {
        ...initialConfig,
        ...userConfig.windowConfig,
      };
    }
    if (Object.hasOwnProperty.call(userConfig, "ignoreMouseEvents")) {
      ignoreMouseEvents = userConfig.ignoreMouseEvents;
    }
  }
}

// preloadを追加
function addWebPreferences(preload) {
  const webPreferences = {
    nodeIntegration: true, // false is default value after Electron v5
    contextIsolation: true, // protect against prototype pollution
    enableRemoteModule: false, // turn off remote
  };
  if (preload) {
    webPreferences.preload = preload;
    webPreferences.nodeIntegration = false;
  }
  return { ...initialConfig.webPreferences, ...webPreferences };
}

// ウィンドウを作成
function createWindow(preload) {
  initialConfig.webPreferences = addWebPreferences(preload);

  const win = new BrowserWindow(initialConfig);

  // デバッグモード
  if (initialConfig.webPreferences.devTools) {
    win.webContents.openDevTools();
  }
  if (ignoreMouseEvents) {
    win.setIgnoreMouseEvents(true);
  }

  return win;
}

module.exports = {
  windowConfig: initialConfig,
  overrideConfig: overrideConfig,
  createWindow: createWindow,
};
