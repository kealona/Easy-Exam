//获取用户的地理位置，发送给后端

export const getGEOPosition = function() {
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			showPosition(position)
		}, (err) => {console.log('未开启定位', err)}, { enableHighAccuracy: false})
	} else {
		
	}
}

/**
 * 展示当前用户的地理位置
 * @param {Object} position 经纬度
 */
function showPosition(position) {
	console.log(`当前经度为：${position.coords.latitude}, 纬度为：${position.coords.longitude}`)
}
