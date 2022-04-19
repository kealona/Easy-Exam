const outputPath = 'rtmp://175.178.86.148:1935/live'
const screenOutPath = 'rtmp://175.178.86.148:1935/video'
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const cp = require('child_process')
let command = null

import os from 'os'

const ffmpegPath = getFfmpegPath()

function getFfmpegPath() {
	//开发环境下获取ffmpeg路径
	if (process.env.NODE_ENV === "development") {
		const ffmpegStaticPath = require('ffmpeg-static-electron').path
		return ffmpegStaticPath
	}
	//生产环境下获取ffmpeg.exe的路径
	else {
		const appRootDir = require('app-root-dir')
		const platform = os.platform() == 'win32' ? 'win' : os.platform()
		return `${appRootDir.get().split('app.asar')[0]}/ffmpeg-static-electron/bin/${platform}/${os.arch()}/ffmpeg.exe`
	}
}

//杀死ffmpeg的进程
function stopPush() {
	command.kill()
}

//获取所有输入输出设备编号
export const getDevices = function getDevices() {
	return new Promise((resolve, reject) => {
		// 视频设备
		let videoList = []
		// 音频设备
		let audioList = []
		// 视频设备标记
		let videoFlag = false
		// 音频设备标记
		let audioFlag = false
		let devicesCmd = cp.spawn(ffmpegPath, ["-f", "dshow", "-list_devices", "true", "-i",
			"dummy"
		]);
		let devices = '';
		devicesCmd.stderr.on("data", data => {
			devices += data.toString();
			console.log(data)
		});
		devicesCmd.on("close", code => {
			// 换行符
			const splitFlag = (process.platform === 'win32' ? '\r\n' : '\n')
			const lines = devices.split(splitFlag);
			for (let i = 0; i < lines.length; i++) {
				const device = lines[i]
				if (device.indexOf('[dshow') > -1) {
					if (device.indexOf('DirectShow video devices') > -1) {
						videoFlag = true;
						audioFlag = false;
					} else if (device.indexOf('DirectShow audio devices') > -1) {
						videoFlag = false;
						audioFlag = true;
					} else if (videoFlag && device.indexOf('Alternative name') == -1) {
						if (device.match(/\"(.*)\"/)) {
							const videoName = device.match(/\"(.*)\"/)[1]
							videoList.push(videoName);
						}
					} else if (audioFlag && device.indexOf('Alternative name') == -1) {
						if (device.match(/\"(.*)\"/)) {
							let audioNname = device.match(/\"(.*)\"/)[1];
							audioList.push(audioNname);
						}
					}
				}
			}
			resolve({
				audio: audioList,
				video: videoList
			})
		});
		let timer
		timer = setInterval(() => {
			if (videoList.length == 0) {
				//如果命令执行失败，重新执行
				devicesCmd = ''
				devicesCmd = cp.spawn(ffmpegPath, ["-f", "dshow", "-list_devices", "true", "-i",
					"dummy"
				]);
				devices = '';
			} else {
				clearInterval(timer)
			}
		}, 3000)
	})
}

/**
 * 开始视频推流
 * @param {Object} videoName 视频设备编号
 * @param {Object} audioName 音频设备编号
 * @param {String} key 推流密钥
 */
export const pushStream = async function(videoName, audioName, key, callback) {

	if (videoName == 'desktop') {
		command = new ffmpeg(videoName)
			.setFfmpegPath(ffmpegPath)
			.inputFormat('gdigrab')
			.inputFPS(30)
			.size('-s 1280x720')
			.addOptions([
				'-vcodec libx264',
				'-preset:v ultrafast',
				'-tune:v zerolatency',
				'-max_delay 100',
				'-g 2',

			])
			.format('flv')
			.outputOptions([
				'-b:v 3500k',
				'-rtsp_transport tcp'
			])
			.output(screenOutPath + '/' + key, {
				end: true
			})
			.on('start', function(commandLine) {
				console.log(`${new Date()}video is pushing`)
				console.log(`${commandLine}`)
			})
			.on('error', function(err, stdout, srderr) {
				console.error(err)
			})
			.on('end', function() {
				console.log(`${new Date()}video Pushing is finished`)
			})
	} else {

		command = ffmpeg()
			.setFfmpegPath(ffmpegPath)
			/* .addOptions([
				'-thread_queue_size 6',
				'itsoffset -0.08', 
			]) */
			.input(`video=${videoName}`)
			.inputFormat('dshow')
			.input(`audio=${audioName}`)
			.inputFormat('dshow')
			.inputFPS(30)
			.size('-s 1280x720')
			.addOptions([
				'-rtbufsize 1024M',
				'-audio_buffer_size 1k',
				'-vcodec libx264',
				'-preset:v ultrafast',
				'-tune:v zerolatency',
				'-max_delay 100',
				'-g 2',
				/* '-thread_queue_size 6', */
				/* '-itsoffset -0.08' */
			])
			.format('flv')
			.outputOptions([
				'-b:v 3500k',
				'-rtsp_transport tcp'
			])
			.output(outputPath + '/' + key, {
				end: true
			})
			.on('start', callback)
			.on('error', function(err, stdout, stderr) {
				console.error(err)
				console.log('stdout: ' + stdout);
				console.log('stderr: ' + stderr);
				stopPush()
			})
			.on('end', function() {
				console.log(`${new Date()}video Pushing is finished`)
			})

	}

	command.run()
}
