@ECHO OFF
REM # ShiftJIS / CRLF

setlocal ENABLEDELAYEDEXPANSION
CD /D "%~dp0"

set path_project=%~dp0dist\win-unpacked\
set path_app=%path_project%file-uploader.exe

REM # �E�C���h�E�^�C�g���ŏd���N�����m�F�i�u���E�U�̃E�C���h�E�^�C�g���j
tasklist /FI "WINDOWTITLE eq MainWindow" | findstr "[0-9]" >NUL
if %ERRORLEVEL% == 1 (
 	start /min "MainWindow" "%path_app%" --plugins=%path_project%plugins --readDir=%USERPROFILE%/Pictures --saveDir=%~dp0plugins
 	SET /p x=%DATE% %TIME:~0,8%  �N����... <NUL
 	CALL :WAIT 3
 ) else (
 	ECHO ���ɋN����
)
EXIT 0

:WAIT
SET /p x=%1�b�ҋ@���܂� <NUL
FOR /l %%i in (1,1,%1) DO (ping 127.0.0.1 -n 2 >NUL & SET /p <NUL=%%i )
ECHO ����
GOTO EXIT
:USAGE
ECHO �����ɑҋ@�b�����w�肵�Ă��������i���̃o�b�`����Ăԏꍇ��CALL WAIT 10���j
:EXIT

EXIT /b 0