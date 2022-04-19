'use strict'

import {
	app,
	protocol,
	BrowserWindow,
	ipcMain
} from 'electron'
import {
	createProtocol,
	installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

app.allowRendererProcessReuse = true

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
	scheme: 'app',
	privileges: {
		secure: true,
		standard: true
	}
}])

function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		width: 400,
		height: 600,
		center: true,
		resize: false,
		//隐藏关闭，最大化，最小化按钮
		//frame: false,
		webPreferences: {
			nodeIntegration: true
		}
	})

	//添加搜搜设备事件
	win.webContents.session.on('select-hid-device', (event, details, callback) => {
		event.preventDefault()
		if (details.deviceList && details.deviceList.length > 0) {
			callback(details.deviceList[0].deviceId)
		}
	})

	//关闭菜单栏
	//win.setMenu(null)

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
		if (!process.env.IS_TEST) win.webContents.openDevTools()
	} else {
		createProtocol('app')
		// Load the index.html when not in development
		win.loadURL('app://./index.html')
	}

	win.on('closed', () => {
		win = null
	})

	//修改窗口大小
	ipcMain.on('process-window', () => [
		win.setSize(1200, 700)
		//win.center()
	])

	ipcMain.on('exam-window', () => {
		win.maximize()
		//win.center()
	})
	
	ipcMain.on('window-close', () => {
		win.close()
	})
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installVueDevtools()
		} catch (e) {
			console.error('Vue Devtools failed to install:', e.toString())
		}
	}
	createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === 'win32') {
		process.on('message', data => {
			if (data === 'graceful-exit') {
				app.quit()
			}
		})
	} else {
		process.on('SIGTERM', () => {
			app.quit()
		})
	}
}
