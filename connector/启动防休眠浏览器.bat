@echo off
rem ============================================================
rem  观俗 · 执镜 —— 防休眠浏览器启动器（直播专用）
rem
rem  作用：用「关闭后台节流」的参数启动浏览器，让油猴礼物连接器
rem        在你切换到别的窗口时仍能正常监听礼物事件。
rem
rem  注意：
rem    - 启动后可以随意切换窗口、缩小、被遮挡，连接器照常工作
rem    - 但【不要最小化】直播间窗口、不要锁屏——最小化会彻底
rem      停止页面渲染，任何脚本都救不回来
rem ============================================================

setlocal
set "BROWSER="

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "BROWSER=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" set "BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" set "BROWSER=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if not defined BROWSER (
  echo [错误] 未找到 Chrome 或 Edge，请告诉我你用的浏览器，我来加路径。
  pause
  exit /b 1
)

rem 关键检查：浏览器已在运行时，新参数不会生效（只会开一个普通标签页）
set "RUNNING="
tasklist /FI "IMAGENAME eq chrome.exe" 2>nul | findstr /I "chrome.exe" >nul && set "RUNNING=chrome"
tasklist /FI "IMAGENAME eq msedge.exe" 2>nul | findstr /I "msedge.exe" >nul && set "RUNNING=edge"

if defined RUNNING (
  echo.
  echo  [警告] 检测到浏览器（%RUNNING%）正在运行！
  echo  防休眠参数只对「全新启动」的浏览器生效。
  echo  请先彻底关闭所有浏览器窗口（包括右下角托盘图标右键退出），
  echo  然后再双击本启动器。
  echo.
  pause
  exit /b 1
)

echo 以防休眠模式启动：%BROWSER%
start "" "%BROWSER%" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding https://live.douyin.com/
echo.
echo  浏览器已启动，请依次确认：
echo    1. 抖音直播页已打开并登录
echo    2. 右下角「观俗连接器」角标为绿色 ●
echo    3. 之后可以随便切窗口，但不要最小化直播间窗口
echo.
pause
