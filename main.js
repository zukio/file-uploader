const { app, ipcMain } = require("electron");
const { dialog } = require("electron");
const fs = require("fs");

const path = require("path");
const plugins = require("./modules/readPlugins.js");
const window = require("./modules/window.js"); // 設定ファイルを読み込む

let pluginDir;
let readDir;
let saveDir;
let mainWindow;

// このElectron アプリのシングルインスタンスロックを要求
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // もし他のインスタンスが既に実行中なら、このインスタンスを終了
  app.quit();
} else {
  // ============================================
  // 二つ目のインスタンスが起動しようとした時の処理
  // --------------------------------------------
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      // 既に開いているウィンドウをフォーカスする
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      // 既存のウィンドウがない（閉じられている）場合
      // createWindow();
      app.quit();
    }
  });

  // ============================================
  // アプリケーションのライフサイクル
  // --------------------------------------------
  // 起動時
  // app.on("ready", () => {}) の promise
  app.whenReady().then(() => {
    try {
      // 起動時引数を受け取る
      process.argv.forEach((arg) => {
        if (arg.startsWith("--") && arg.includes("=")) {
          let splitItem = arg.substring(2).split("=");
          switch (splitItem[0]) {
            case "readDir":
              readDir = path.normalize(splitItem[1].endsWith("/") ? splitItem[1] : splitItem[1] + "/");
              readDir = path.isAbsolute(readDir) ? readDir : path.join(__dirname, readDir);
              break;
            case "saveDir":
              saveDir = path.normalize(splitItem[1].endsWith("/") ? splitItem[1] : splitItem[1] + "/");
              saveDir = path.isAbsolute(saveDir) ? saveDir : path.join(__dirname, saveDir);
              break;
            case "plugins":
              pluginDir = path.normalize(splitItem[1].endsWith("/") ? splitItem[1] : splitItem[1] + "/");
              pluginDir = path.isAbsolute(pluginDir) ? pluginDir : path.join(__dirname, pluginDir);
              break;
          }
        }
      });

      // 起動時引数で受け取ったパスからプラグインjsを読み込む
      if (pluginDir) {
        const dirPath = path.isAbsolute(pluginDir) ? pluginDir : path.join(__dirname, pluginDir);

        // ディレクトリの存在確認
        if (fs.existsSync(dirPath)) {
          plugins.readPlugins(dirPath);
          // プラグインディレクトリからの相対パスを絶対パスに変換する
          if (typeof readStore !== "undefined") readDir = plugins.cvtAbsolutePath(readStore);
          if (typeof saveStore !== "undefined") saveDir = plugins.cvtAbsolutePath(saveStore);
        } else {
          console.error(`Plugin directory does not exist: ${dirPath}`);
        }
      }

      // 起動時引数が未指定の場合、ホームディレクトリを設定
      readDir = readDir || __dirname; //path.join(os.homedir(), "/");
      saveDir = saveDir || __dirname; //path.join(os.homedir(), "/");

      window.overrideConfig(typeof userConfig !== "undefined" ? userConfig : {});
      // ウィンドウを作成 (フロント連携用の preload.js を読み込む)
      mainWindow = window.createWindow(path.join(__dirname, "./modules/preload.js"));
      // ユーザー設定で上書き
      if (typeof userConfig !== "undefined") {
        // メニューバーを非表示にする
        if (Object.hasOwnProperty.call(userConfig.windowConfig, "menu") && !userConfig.menu) {
          mainWindow.setMenu(null);
        }
      }
      mainWindow.loadFile("./src/index.html"); // Your HTML file

      mainWindow.on("closed", function () {
        mainWindow = null;
      });

      mainWindow.once("ready-to-show", () => {
        if (!window.windowConfig.show) {
          mainWindow.show();
        }
        mainWindow.focus();
      });

      // html側（レンダラープロセス）にデータを送信する
      mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.send("mounted", {
          data: {
            readDir: readDir ?? null,
            saveDir: saveDir ?? null,
            headers: typeof headers !== "undefined" ? headers : null,
            apiep: typeof apiep !== "undefined" ? apiep : null,
          },
        });
      });
    } catch (error) {
      console.error("Startup Error:", error);

      // Notify the user
      dialog.showErrorBox(
        "Startup Error",
        "An error occurred during application startup. Please check the configuration and try again."
      );

      // Graceful shutdown
      app.quit();
    }
  });

  // すべてのウィンドウが閉じられた時に終了する
  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", function () {
    // macOSでドックアイコンをクリックしてアプリが再起動した時にウィンドウを再作成する
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // ============================================
  // html側（レンダラープロセス）からのイベント
  // --------------------------------------------
  // ファイルを開くためのIPCイベント
  ipcMain.handle("open-file-dialog", async (event) => {
    const config = {
      properties: ["openFile"],
      defaultPath: path.isAbsolute(readDir) ? readDir : path.join(__dirname, readDir),
    };
    config.filters = getFilters();
    const { filePaths } = await dialog.showOpenDialog(mainWindow, config).catch((err) => {
      console.error(err);
    });
    if (filePaths.length > 0) {
      try {
        //const data = await fs.readFile(filePaths[0], "utf8");
        //return data;
        console.log(filePaths[0]);
        return filePaths[0]; // 最初のファイルパスを返す
      } catch (err) {
        console.error(err);
        return null;
      }
    }
  });

  // ファイルを保存するためのIPCイベント
  ipcMain.handle("save-file-dialog", async (event, content) => {
    // 現在のタイムスタンプを取得し、ファイル名に組み込む
    const timestamp = new Date().getTime();
    const defaultFileName = `qr_${timestamp}.png`; // 例: "qr_1631025412345.png"
    const defaultPath = path.join(path.isAbsolute(saveDir) ? saveDir : path.join(__dirname, saveDir), defaultFileName); // saveDirは適切に定義されている前提

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultPath,
      filters: [{ extensions: ["png", "jpg", "jpeg"] }], // 必要に応じて拡張子を変更
    });
    if (filePath) {
      try {
        const buffer = Buffer.from(content, "base64");
        fs.writeFile(filePath, buffer, (err) => {
          if (err) throw err;
          console.log("The file has been saved!");
        });
        //await fs.writeFile(filePath, content, "utf8");
        //await fs.writeFile(filePath, content);
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    }
  });

  function getFilters() {
    if (
      typeof headers === "undefined" ||
      !headers.Accept ||
      headers.Accept.length === 0 ||
      headers.Accept == "*/*" ||
      headers.Accept[0] === "*/*"
    ) {
      return [{ name: "All Files", extensions: ["*"] }];
    }
    const filters = [];
    // Accept ヘッダから extensions を抽出 // MIMEタイプを小文字に変換してから処理
    const extensions = headers.Accept.map((accept) => accept.split("/")[1].toLowerCase());

    // Videos と Images のカウント
    const videoTypes = headers.Accept.filter((accept) => accept.toLowerCase().startsWith("videos/"));
    const imageTypes = headers.Accept.filter((accept) => accept.toLowerCase().startsWith("images/"));

    if (videoTypes.length > 0) {
      const videoExtensions = videoTypes.map((accept) => accept.split("/")[1]);
      filters.push([{ name: "Videos", extensions: videoExtensions }]);
      if (videoExtensions.length === headers.Accept.length) {
        // 全て Videos
      }
    }
    if (imageTypes.length > 0) {
      const imageExtensions = imageTypes.map((accept) => accept.split("/")[1]);
      filters.push([{ name: "Images", extensions: imageExtensions }]);
      if (imageExtensions.length === headers.Accept.length) {
        // 全て Images
      }
    }
    return filters;
  }
}
