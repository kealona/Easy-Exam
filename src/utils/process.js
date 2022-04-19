const childProcess = require('child_process')
const exec = childProcess.exec

const whiteList = ['iexplore.exe', 'sogouexplorer.exe', 'The world.exe', 'Firefox.exe', 'opera.exe', '360SE.exe',
	 'Safari.exe', 'Maxthon.exe', 'Netscape.exe', 'QQ.exe', 'msedge.exe', 'chrome.exe'
]

/**
 * 遍历所有进程，关闭黑名单中的进程
 * 方法一：把黑名单中的进程杀死
 * 方法二：把所有无关进程都关闭，只留下白名单的进程
 */
export const viewProcessMessage = function(name, cb) {
	let cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux'
	let processList = []
	exec(cmd, function(err, stdout, stderr) {
		if (err) {
			return console.error(err)
		}
		stdout.split('\n').filter((line) => {
			let processMessage = line.trim().split(/\s+/)
			let processName = processMessage[0] //processMessage[0]进程名称 ， processMessage[1]进程id
			if (whiteList.indexOf(processName) != -1) {
				//process.kill(processMessage[1])
			}
			processList.push(processMessage)
			//console.log(`进程名称：${processName}	进程id:${processMessage[1]}`)
		})
	})
	return processList
}
