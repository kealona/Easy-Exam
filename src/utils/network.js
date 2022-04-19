//监听网络环境变化
const os = require('os')

//上次ip地址
let lastIP
//回调函数
let nextword_callback

/**
 * 创建网络变化的监听器
 * @param {Function} onlineCallback 网络连接回调
 * @param {Function} offlineCallback 网络断开连接的回调
 */
export const createNetworkMonitor = function(onlineCallback, offlineCallback, callback) {
	window.addEventListener('online', onlineCallback)
	window.addEventListener('offline', offlineCallback)
	nextword_callback = callback
	lastIP = getNetworkIP()
}

/**
 * 和上一次的IP地址比较，是否变化了
 */
export const compareNetworkMonitor = function() {
	const curIP = getNetworkIP()
	if(lastIP && curIP == lastIP) {
		
	} else {
		lastIP = curIP
		//todo 给后端提醒，用户IP变化异常
		nextword_callback(lastIp, curIp)
		console.log('网络异常变化')
	}
}

/**
 * 获取当前连接网络的IP地址
 */
const getNetworkIP = function() {
	let needHost = ''; // 打开的host
	try {
		// 获得网络接口列表
		let network = os.networkInterfaces();
		for (let dev in network) {
			let iface = network[dev];
			for (let i = 0; i < iface.length; i++) {
				let alias = iface[i];
				if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
					needHost = alias.address;
				}
			}
		}
	} catch (e) {
		needHost = 'localhost';
	}
	return needHost;
}
