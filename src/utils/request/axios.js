import axios from "axios"
import {
	baseURL
} from './url.js'
import router from '../../router/index.js'

//修改axios默认配置
axios.defaults.baseURL = baseURL
axios.defaults.timeout = 10000
axios.defaults.headers["Content-Type"] = 'application/json'

//请求白名单【不需要token验证】
const whiteList = ['/users/login']
//需要设置防抖请求的请求列表【防止重复请求】
const debounceList = ['/users/login']

//请求拦截器，统一处理请求
axios.interceptors.request.use(async function(config) {
	//阻止重复请求
	
	const token = localStorage.getItem('token')
	//在不是白名单的请求中添加token
	if (whiteList.indexOf(config.url) === -1) {
		//不在白名单中，查询token是否存在
		//如果token不存在，则退会登录界面，提醒用户先登录
		if (!token) {
			router.replace('/login')
			//todo 提醒用户登录
		} else {
			config.headers['token'] = token
		}
	}
	return config
}, (err) => {
	//请求失败后 do something 
})

//统一处理响应
/* axios.interceptors.response.use(function(res) => {
	
}, (err) => {
	//响应失败后 do something
}) */

/**
 * 停止请求
 */
function stopRequest() {
	
	
}

export default axios
