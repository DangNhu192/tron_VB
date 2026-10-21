@echo off
setlocal
title Deploy AutoDoc Extension 2.0 to GitHub
set "DEPLOY_EXIT=0"
set "DEPLOY_NO_PAUSE="
if /i "%~1"=="/no-pause" set "DEPLOY_NO_PAUSE=1"
set "REPO_URL=https://github.com/DangNhu192/tron_VB.git"
pushd "%~dp0"
if errorlevel 1 exit /b 1

echo ============================================================
echo     DEPLOY AUTODOC EXTENSION 2.0 - GITHUB MAIN
echo ============================================================
echo.

where git >nul 2>&1
if errorlevel 1 goto missing_git
where node >nul 2>&1
if errorlevel 1 goto missing_node

if not exist ".git" (
    git init -b main
    if errorlevel 1 goto failed
)
set "DEPLOY_MAIN="
for /f "delims=" %%B in ('git branch --show-current') do if "%%B"=="main" set "DEPLOY_MAIN=1"
if not defined DEPLOY_MAIN goto wrong_branch

git config user.name >nul 2>&1
if errorlevel 1 git config user.name "DangNhu192"
git config user.email >nul 2>&1
if errorlevel 1 git config user.email "DangNhu192@users.noreply.github.com"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin "%REPO_URL%"
    if errorlevel 1 goto failed
) else (
    for /f "delims=" %%R in ('git remote get-url origin') do if "%%R"=="%REPO_URL%" set "DEPLOY_REMOTE_OK=1"
    if not defined DEPLOY_REMOTE_OK goto wrong_remote
)

echo [1/4] Checking remote main and preserving its history...
git ls-remote --exit-code origin refs/heads/main >nul 2>&1
if errorlevel 3 goto failed
if errorlevel 2 goto remote_ready
if errorlevel 1 goto failed
git fetch origin main
if errorlevel 1 goto failed
git merge --ff-only refs/remotes/origin/main
if errorlevel 1 goto failed

:remote_ready
echo [2/4] Checking version and running tests...
node -e "if (require('./manifest.json').version !== '2.0') { console.error('Extension version must remain 2.0'); process.exit(1); }"
if errorlevel 1 goto failed
node tools/run_all_tests.mjs
if errorlevel 1 goto failed

echo [3/4] Staging source files and committing changes...
git add -A -- .
if errorlevel 1 goto failed
git diff --cached --check
if errorlevel 1 goto failed
git diff --cached --quiet
if errorlevel 2 goto failed
if not errorlevel 1 goto push_main
git commit -m "Deploy AutoDoc extension v2.0"
if errorlevel 1 goto failed

:push_main
echo [4/4] Pushing to GitHub main...
git push -u origin main
if errorlevel 1 goto failed
for /f "delims=" %%H in ('git rev-parse HEAD') do set "DEPLOY_COMMIT=%%H"
git ls-remote origin refs/heads/main | findstr /b /l /c:"%DEPLOY_COMMIT%" >nul
if errorlevel 1 goto failed
echo.
echo [OK] GitHub main contains this exact commit:
git rev-parse --short HEAD
echo https://github.com/DangNhu192/tron_VB
echo Extension version remains 2.0. Reload it at chrome://extensions.
goto finish

:missing_git
echo [ERROR] Install Git from https://git-scm.com/downloads
goto failed
:missing_node
echo [ERROR] Install Node.js to run the pre-deploy tests.
goto failed
:wrong_branch
echo [ERROR] This script deploys main only. Integrate your changes into main first.
goto failed
:wrong_remote
echo [ERROR] Origin does not point to DangNhu192/tron_VB. No push was performed.
goto failed
:failed
echo.
echo [ERROR] Deployment stopped. Review the error above; do not force-push.
echo If GitHub requests sign-in, use its browser authentication and run again.
set "DEPLOY_EXIT=1"
:finish
popd
if not defined DEPLOY_NO_PAUSE pause
exit /b %DEPLOY_EXIT%
