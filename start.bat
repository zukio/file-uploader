@ECHO OFF
REM # ShiftJIS / CRLF

setlocal ENABLEDELAYEDEXPANSION
CD /D "%~dp0"

set path_project=%~dp0dist\win-unpacked\
set path_app=%path_project%file-uploader.exe

REM # ウインドウタイトルで重複起動を確認（ブラウザのウインドウタイトル）
tasklist /FI "WINDOWTITLE eq MainWindow" | findstr "[0-9]" >NUL
if %ERRORLEVEL% == 1 (
 	start /min "MainWindow" "%path_app%" --plugins=%path_project%plugins --readDir=%USERPROFILE%/Pictures --saveDir=%~dp0plugins
 	SET /p x=%DATE% %TIME:~0,8%  起動中... <NUL
 	CALL :WAIT 3
 ) else (
 	ECHO 既に起動中
)
EXIT 0

:WAIT
SET /p x=%1秒待機します <NUL
FOR /l %%i in (1,1,%1) DO (ping 127.0.0.1 -n 2 >NUL & SET /p <NUL=%%i )
ECHO 完了
GOTO EXIT
:USAGE
ECHO 引数に待機秒数を指定してください（他のバッチから呼ぶ場合はCALL WAIT 10等）
:EXIT

EXIT /b 0