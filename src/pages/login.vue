<template>
	<div class="yk-login">
		<p class="yk-login-title">考号密码登录</p>

		<div class="yk-login-form">
			<div class="yk-login-form-item">
				<label>邮箱</label>
				<input v-model="email" placeholder="请输入邮箱"/>
			</div>
			<div class="yk-login-form-item">
				<label>密码</label>
				<input v-model="password" type="password" placeholder="请输入密码"/>
			</div>
			<button :class="(email && password) ? 'is-click' : ''" @click="jumpToProcess">登录</button>
		</div>
	</div>
</template>
 
<script>
	import { viewProcessMessage } from '../utils/process.js'
	import { createclipboardObserber } from '../utils/clipboard.js'
	import { createNetworkMonitor } from '../utils/network.js'
	import { getUSBDevices } from '../utils/usb.js'
	import { isVm } from '../utils/vm.js'
	import { getGEOPosition } from '../utils/geo.js'
	import crypto from '../utils/crypto.js'
	/* import { getNetDevices } from '../utils/captrue.js' */
	
	export default {
		name: 'Login',
		
		data() {
			return {
				email: '',		//邮箱
				password: ''		//密码
			}
		},
		
		methods:{
			//跳转到填写信息界面
			jumpToProcess() {
				//关闭所有无关进程
				viewProcessMessage()
				//创建剪切板的监控
				createclipboardObserber((text) => {
					//给后端发送动态
					this.sendEventMsg(11, '存在文字粘贴行为，粘贴内容为：' + text)
					console.log('文字粘贴')
				})
				//创建网络环境检测的监听器
				createNetworkMonitor(this.networkOnline(), this.networkOffline(), (lastIp, curIp) => {
					this.sendEventMsg(8, '网络环境发生变化，IP由' + lastIp + '转为' + curIp)
				})
				//获取所有USB设备
				getUSBDevices()
				//判断当前是否在虚拟机环境
				isVm()
				//获取用户当前的地理位置
				//getGEOPosition()
				//getHIDDevices()
				//getNetDevices()
				this.login()
			},
			/**
			 * 登录
			 */
			login() {
				this.$http.post('/users/login/email', {
						email: this.email,
						password: crypto.encrypt(this.password)
					})
					.then((res) => {
						if (res.data.code == 200) {
							//登录成功提示
							this.$message.success('登录成功')
							//获取用户token
							const token = res.data.data.token
							//JSON化用户数据
							let data = JSON.stringify(res.data.data)
							//存储用户数据
							localStorage.setItem('userInfo', data)
							//设置token
							localStorage.setItem('token', token)
							//请求成功，跳转界面
							this.$router.push('/process')
						} else {
							//错误提示
							this.$message.error(res.data.message)
						}
						
					})
				
			},
			/**
			 * 向后端发送作弊事件
			 * @param {Number} type 作弊类型
			 * @param {Object} description 作弊描述
			 */
			sendEventMsg(type, description) {
				this.$http.post('/invigilate/event/', {
					eventType: type,	//作弊类型
					description: description,	//作弊秒数
					examinationId: localStorage.getItem('examId'),	//考试id
					status: 2
				})
				.then((res) => {
					
				})
				//todo 弹窗提醒用户请勿作弊
			},
			//网络在线的回调
			networkOnline() {
				
			},
			//网络离线的回调
			networkOffline() {
				
			}
		}
	}
</script>

<style scoped="scoped" lang="scss">
	.yk-login {
		height: 100%;
		background-color: $--color-white;
		display: flex;
		align-items: center;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
	}

	.yk-login-title {
		font-size: 21px;
		font-weight: bolder;
		margin-bottom: 45px;
		margin-top: 50px;
		text-align: left;
		width: 70%;
	}
	
	.yk-login-form {
		button {
			background-color: #80b7ff;
			color: $--color-white;
			width: 70vw;
			height: 45px;
			border-color: #80b7ff;
			border-radius: $--border-radius-small;
			border: none;
			transition: all .2s ease-in-out;
			
			&:focus {
				outline: none;
			}
		}
	}
	
	.yk-login-form-item {
		margin-bottom: 40px;
		
		label {
			display: block;
			font-size: 18px;
		}
		
		input {
			border-bottom: $--border-base;
			padding: 8px 5px;
			width: 85%;
			border-width: 0 0 1px 0;
			transition: all .2s ease-in-out;
			
			&:focus {
				border-color: $--color-primary;
				outline: none;
			}
		}
	}
	
	.is-click {
		background-color: $--color-primary !important;
		cursor: pointer;
		
		&:hover {
			background-color: mix($--color-white, $--color-primary, 30%) !important;
		}
	}
</style>
