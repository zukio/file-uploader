const fs = require("fs");
const path = require("path");
const vm = require("vm");

let pluginDir = "";
const jsonList = [];

/// プラグインディレクトリからjsファイルを読み込む
/// @param dirPath:string // プラグインディレクトリのパス。絶対パスか、実行中のスクリプトからの相対パス
function readPlugins(dirPath) {
  pluginDir = dirPath;

  fs.readdirSync(pluginDir).forEach((file) => {
    // `._`で始まるファイルを無視
    if (file.startsWith("._")) return;
    const filePath = path.join(pluginDir, file);

    // ファイル or ディレクトリチェック
    if (fs.statSync(filePath).isFile()) {
      // 拡張子チェック
      const extension = path.extname(filePath);
      switch (extension) {
        case ".js":
          const code = fs.readFileSync(filePath, "utf-8");
          // ファイルの内容を実行
          vm.runInThisContext(code, filePath);
          break;
        case ".json":
          const jsonContent = fs.readFileSync(filePath, "utf-8");
          // ファイルの内容をパースしてjsonDataに格納
          const jsonData = JSON.parse(jsonContent);
          jsonList.push({ filename: file.split(".").shift(), content: jsonData }); // ファイル名と内容を配列に格納
          break;
        default:
          // console.log("Not a JS/JSON file");
          break;
      }
    }
  });
}

/// プラグインディレクトリからの相対パスを絶対パスに変換する
/// @param relativePath:string // プラグインディレクトリからの相対パス
const cvtAbsolutePath = (relativePath) =>
  path.isAbsolute(relativePath) ? relativePath : path.join(pluginDir, relativePath);

module.exports = {
  readPlugins: readPlugins,
  cvtAbsolutePath: cvtAbsolutePath,
};
