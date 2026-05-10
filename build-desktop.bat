@echo off
chcp 65001 >nul
echo ============================================
echo   SMS - Build Desktop App for Windows
echo ============================================
echo.

echo [1/4] Installing dependencies...
call bun install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building Next.js (standalone)...
call npx next build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Copying static assets...

REM Copy .next/static -> .next/standalone/.next/static
if exist ".next\standalone\.next\static" rmdir /s /q ".next\standalone\.next\static"
xcopy ".next\static" ".next\standalone\.next\static\" /E /I /Q >nul
echo   OK - Static files

REM Copy public -> .next/standalone/public
if exist ".next\standalone\public" rmdir /s /q ".next\standalone\public"
xcopy "public" ".next\standalone\public\" /E /I /Q >nul
echo   OK - Public files

REM Copy prisma -> .next/standalone/prisma
if exist ".next\standalone\prisma" rmdir /s /q ".next\standalone\prisma"
xcopy "prisma" ".next\standalone\prisma\" /E /I /Q >nul
echo   OK - Prisma files

REM Copy .prisma client
if exist ".next\standalone\node_modules\.prisma" rmdir /s /q ".next\standalone\node_modules\.prisma"
xcopy "node_modules\.prisma" ".next\standalone\node_modules\.prisma\" /E /I /Q >nul
echo   OK - Prisma client

echo.
echo [4/4] Building Electron app...
call npx electron-builder --win portable
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD SUCCESSFUL!
echo ============================================
echo.
echo   Your app is in: dist-electron\
echo   Run: SMS-Store-Management.exe
echo.
pause
