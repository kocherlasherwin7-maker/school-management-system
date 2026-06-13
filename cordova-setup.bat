@echo off
echo ============================================
echo  St.Gaspar Vidyalaya - Cordova APK Builder
echo ============================================
echo.
echo This script will set up a Cordova project and build an APK.
echo.
echo PREREQUISITES (install first):
echo  1. Node.js from https://nodejs.org (v18+)
echo  2. Java JDK 17 from https://adoptium.net
echo  3. Android Studio with SDK from https://developer.android.com/studio
echo.
echo After installing prerequisites, set ANDROID_HOME:
echo   setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
echo.
echo Press any key to continue...
pause >nul

echo.
echo Step 1: Installing Cordova...
call npm install -g cordova
if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Install Node.js first.
    pause
    exit /b 1
)

echo.
echo Step 2: Creating Cordova project...
cd /d "%~dp0"
if exist "mobile-app" rmdir /s /q "mobile-app"
call cordova create mobile-app com.stgaspar.school "StGasparVidyalaya"
if %errorlevel% neq 0 (
    echo ERROR: Cordova create failed.
    pause
    exit /b 1
)

echo.
echo Step 3: Copying web files to Cordova project...
xcopy /E /Y "frontend\*" "mobile-app\www\" >nul
echo Files copied successfully.

echo.
echo Step 4: Adding Android platform...
cd mobile-app
call cordova platform add android
if %errorlevel% neq 0 (
    echo ERROR: Android platform add failed. Ensure Android SDK is installed.
    pause
    exit /b 1
)

echo.
echo Step 5: Building APK...
call cordova build android --release
if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED. Common fixes:
    echo  - Open Android Studio, let it install missing SDK components
    echo  - Run: cordova requirements
    echo  - Set JAVA_HOME to JDK 17 path
    pause
    exit /b 1
)

echo.
echo ============================================
echo  SUCCESS! APK built at:
echo  %~dp0mobile-app\platforms\android\app\build\outputs\apk\release\
echo ============================================
echo.
echo Quick Install Steps:
echo  1. Copy the .apk file to your Android phone
echo  2. Open Settings > Security > Enable "Install from Unknown Sources"
echo  3. Tap the APK file to install
echo.
pause