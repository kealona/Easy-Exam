import {
	wsURL
} from './url.js'

//websocket连接
let ws = null
//ws接收消息回调
let websocket_callback = null
//心跳时间
let timeout = 20 * 1000
//心跳倒计时
let timeoutObj = null
let serverTimeoutObj = null
//断开 重连倒计时
let timeoutnum = null

//初始化websocket连接
export function initWsCollection(callback) {
	ws = new WebSocket(wsURL + 'invigilate/ws' + '?examId=' + localStorage.getItem('examId'), localStorage.getItem('token'))
	ws.onopen = handleOpen
	ws.onmessage = handleMesage
	ws.onerror = handleError
	ws.onclose = handleClose
	
	websocket_callback = callback
}

//连接ws成功
function handleOpen() {
	console.log('open')
	//连接成功，开始心跳
	startWsHeartbeat()
}

//ws数据接收统一处理
function handleMesage(res) {
	console.log(`接收消息=${res.data}`)
	websocket_callback(JSON.parse(res.data))
	resetHeart()
}

//ws连接断开
function handleError() {
	console.log('error')
	recoonnect()
}

//ws连接关闭处理
function handleClose() {
	console.log('close')
	recoonnect()
}

//开始心跳
function startWsHeartbeat () {
	//清除心跳倒计时
	timeoutObj && clearTimeout(timeoutObj);
	serverTimeoutObj && clearTimeout(serverTimeoutObj);
	
	timeoutObj = setInterval(() => {
		if(ws.readyState === 1) {
			//如果连接正常，向后端发送一个心跳
			ws.send(JSON.stringify({
				type: 3,
				text: 'Heart check'
			}))
		} else {
			//重连
			recoonnect()
		}
		serverTimeoutObj = setTimeout(() => {
			//超时关闭
			ws.close()
		}, timeout)
	}, timeout)
}

//重置心跳
function resetHeart() {
	//清除时间
	  clearTimeout(timeoutObj);
	  clearTimeout(serverTimeoutObj);
	  //重启心跳
	  /* let user = localStorage.getItem('qrtMallUser');
	  if (!meetNull(user)) {
	    console.log('退出了登录,不需要重连');
	    return;
	  } */
	  startWsHeartbeat();
}

//重连websocket
function recoonnect() {
	if (!ws) {
	    return;
	  }

	  // 没连接上会一直重连，设置延迟避免请求过多
	  timeoutnum && clearTimeout(timeoutnum);
	  timeoutnum = setTimeout(function() {
	    // 新连接
	    initWsCollection();
	  }, 5000);
}

