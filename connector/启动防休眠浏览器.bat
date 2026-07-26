@echo off
rem ============================================================
rem  观俗 · 执镜 —— 防休眠浏览器启动器（直播专用）
rem
rem  作用：用「关闭后台节流」的参数启动浏览器，让油猴礼物连接器
rem        在你切换到别的窗口时仍能正常监听礼物事件。
rem
rem  用法：
rem    1. 先关掉所有 Chrome / Edge 窗口（必须彻底退出，
rem       否则新参数不会生效——后台已有进程时只会新开一个普通标签页）
rem    2. 双击本文件，浏览器会以「防休眠模式」打开抖音直播页
rem    3. 登录、进你的直播间，确认右下角「观俗连接器 ●」角标亮起
rem
rem  注意：
rem    - 之后可以随意切换窗口、把直播间窗口缩小、被别的窗口挡住，
rem      连接器都会继续工作
rem    - 但【不要最小化】直播间窗口、不要锁屏——最小化会彻底停止
rem      页面渲染，任何脚本都救不回来
rem    - 油猴脚本安装在你的默认浏览器配置里，所以本启动器
rem      直接使用默认配置， Tampermonkey 与登录状态都在
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

echo 以防休眠模式启动：%BROWSER%
start "" "%BROWSER%" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding https://live.douyin.com/
echo 已启动。请确认右下角「观俗连接器」角标为绿色 ● 后再开始直播。
timeout /t 5 >nul
