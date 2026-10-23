@echo off
setlocal
cd /d "%~dp0"
echo.
echo  YuTara Marketplace - test launch
echo  --------------------------------
echo  Building the app (first run takes a moment)...
call npm run build
if errorlevel 1 goto :error
echo.
echo  Starting YuTara...
echo    Local:  http://localhost:3000
echo    LAN:    http://YOUR-LAN-IP:3000   (run "ipconfig" to find your IPv4)
echo.
echo  Sample accounts (password 12345):
echo    buyer@yutara.com   seller@yutara.com   admin@yutara.com
echo.
echo  Note: data is stored in each browser, so testers each see their own data.
echo  Press Ctrl+C to stop.
echo.
call npm run start -- -H 0.0.0.0 -p 3000
goto :eof

:error
echo.
echo  Build failed. Make sure dependencies are installed: run "npm install" here.
pause
