const { app, BrowserWindow } = require('electron')
const { spawn, execSync } = require('child_process')
const path = require('path')

let mainWindow
let nextProcess

const isDev = !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'سیستم مدیریتی فروشگاه',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Remove menu bar for cleaner look
  mainWindow.setMenuBarVisibility(false)

  // Show loading screen
  mainWindow.loadFile(path.join(__dirname, 'loading.html'))

  if (isDev) {
    // Development: connect to running Next.js dev server (run `bun run dev` first)
    const checkReady = setInterval(() => {
      mainWindow.loadURL('http://localhost:3000').then(() => {
        clearInterval(checkReady)
      }).catch(() => {
        // Server not ready yet, keep trying
      })
    }, 1000)
  } else {
    // Production: start Next.js standalone server
    const appDir = path.join(process.resourcesPath, 'app')
    const nodePath = process.execPath

    nextProcess = spawn(nodePath, ['server.js'], {
      cwd: appDir,
      env: {
        ...process.env,
        PORT: '3456',
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    })

    nextProcess.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(output)
      if (output.includes('Ready') || output.includes('started') || output.includes('Listening')) {
        mainWindow.loadURL('http://127.0.0.1:3456')
      }
    })

    nextProcess.stderr.on('data', (data) => {
      console.error(data.toString())
    })

    // Fallback: try loading after 5 seconds
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL('http://127.0.0.1:3456').catch(() => {})
      }
    }, 5000)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM')
    nextProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM')
    nextProcess = null
  }
})
