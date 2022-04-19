const $electron = global.elRequire('electron')
const { clipboard, NativeImage } = $electron

//定时器
let timer = null
//定时器的间隔
const duration = 500
//上次复制的内容
let beforeText = ''
//上次复制的图片的内容
let beforeImg = NativeImage
//文字粘贴行为的回调函数
let textChange
//图片粘贴行为的回调函数
let imageChange

/**
 * 清除定时器
 */
function clearTimer() {
	clearInterval(timer)
}

/**
 * 设置剪切板默认内容
 */
function setClipboardDefaultValue() {
	if(textChange) {
		beforeText = clipboard.readText()
	}
	if(imageChange) {
		beforeImg = clipboard.readImage()
	}
}

/**
 * 设置剪切板见日你刚起
 * @param {Function} cb1 文字粘贴回调
 * @param {Function} cb2 图片粘贴回调
 */
function setTimer(cb1, cb2) {
	timer = setInterval(() => {
		//是否有文本监听器
		if(textChange) {
			const text = clipboard.readText()
			//如果文本没有变化
			if(isDiffText(beforeText, text)) {
				//执行此次变化的回调
				cb1(text, beforeText)
				//记录此次变化内容
				beforeText = text
			}
		}
		//是否有图片的监听器
		if(imageChange) {
			const img = clipboard.readImage()
			//如果图片没有变化
			if(isDiffImage(beforeImg, img)) {
				//执行此次变化的回调
				cb2(img, beforeImg)
				//记录此次变化内容
				beforeImg = img
			}
		}
	}, duration)
}

/**
 * 两次文本是否一致
 * @param {String} before 变化前的文本
 * @param {String} after 变化后的文本
 */
function isDiffText(before, after) {
	return after && before != after
}

/**
 * 两个图片是否一致
 * @param {Object} before 变化前的图片
 * @param {Object} after 变化后的图片
 */
function isDiffImage(before, after) {
	return after && !after.isEmpty() && before.toDataURL() !== after.toDataURL();
}

/**
 * 创建剪切板监听器
 * @param {Function} textChangeCb 文字剪切的回调函数
 * @param {Function} imgChangeCb 图片改变的回调函数
 */
export const createclipboardObserber = function createObserver(textChangeCb, imgChangeCb) {
	//确定回调函数
	textChange = textChangeCb
	imageChange = imgChangeCb
	
	//设置剪切板默认内容
	setClipboardDefaultValue()
	
	//添加剪切板监听器
	setTimer(textChange, imageChange)
}

/**
 * 停止剪切板监听
 */
export const stopClipboardObserver = function () {
	clearTimer()
}