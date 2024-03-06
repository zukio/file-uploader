// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorld を使用して、新しい API オブジェクトをウィンドウ オブジェクトに追加します。
// これにより、レンダラー プロセスが公開する関数にアクセスできるようになります。
contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  sendAsync: (channel, data) => {
    // [非同期]ipcRenderer.invokeを使用して非同期IPCを実装
    return ipcRenderer.invoke(channel, data);
  },
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  onAsync: (channel, func) => {
    // [非同期]ipcMain.handleを使用して非同期IPCを実装
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
  },
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  saveFileDialog: (content) => ipcRenderer.invoke("save-file-dialog", content),
});

// * send : メイン プロセスにメッセージを送信
//   HTML（レンダラープロセス）からは、window.api.send(channel, data) を使用して呼び出すことができます。
// * sendAsync: メイン プロセスにメッセージを送信し、応答を待機（Promiseを返します）
//   HTML（レンダラープロセス）からは、window.api.sendAsync(channel, data) を使用して呼び出すことができます。
//   メインプロセスからは、event.reply を使用して応答を送信できます。
// * on : メイン プロセスからメッセージを受信
//   HTML（レンダラープロセス）からは、window.api.on(channel, func) を使用して呼び出すことができます。
// * onAsync : メイン プロセスからメッセージを受信し、応答を送信
//   HTML（レンダラープロセス）からは、window.api.onAsync(channel, func) を使用して呼び出すことができます。
//   メインプロセスからは、event.reply または events.returnValue を使用して応答を送信できます。
