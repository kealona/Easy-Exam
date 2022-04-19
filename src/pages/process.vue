<template>
	<div class="yk-process">
		<!-- 步骤栏 开始 -->
		<div class="yk-steps">
			<div class="yk-step-item">
				<span class="yk-step-item__number" :class="stepNumber >= 1 ? 'is-active' : ''">1</span>
				<span class="yk-step-item-namee">
					摄像头和麦克风
				</span>
			</div>
			<div class="yk-step-line" :class="stepNumber == 2 ? 'is-active-line': ''"></div>
			<div class="yk-step-item">
				<span class="yk-step-item__number" :class="stepNumber >= 2 ? 'is-active' : ''">2</span>
				<span class="yk-step-item-name">
					身份认证
				</span>
			</div>
			<div class="yk-step-line" :class="stepNumber == 3 ? 'is-active-line': ''"></div>
			<div class="yk-step-item">
				<span class="yk-step-item__number" :class="stepNumber >= 3 ? 'is-active' : ''">3</span>
				<span class="yk-step-item-name">
					屏幕录制
				</span>
			</div>
			<div class="yk-step-line" :class="stepNumber == 4 ? 'is-active-line': ''"></div>
			<div class="yk-step-item">
				<span class="yk-step-item__number" :class="stepNumber >= 4 ? 'is-active' : ''">4</span>
				<span>进入等待室</span>
			</div>
		</div>
		<!-- 步骤栏 结束 -->

		<div class="yk-operation-container">
			<!-- 步骤一 摄像头和麦克风 开始 -->
			<div v-show="stepNumber == 1" class="yk-op-camera">
				<div class="yk-op-camera-item">
					<div class="yk-media" style="width: 20rem;height: 15rem;" ref="userMeida">
						<video width="320px" height="240px" muted ref="video"></video>
						<div class="yk-media-status">
							调试状态：
							<span :class="state == '正常' ? 'is-green' : ''">{{ state }}</span>
						</div>
					</div>
				</div>
				<div class="yk-op-camera-item">
					<div>
						<label>摄像头</label>
						<el-select v-model="video" placecholder="请选择">
							<el-option v-for="(item,index) in videoInput" :key="item.deviceId" :label="item.name"
								:value="item.name" @click.native="changeVideo(item)"></el-option>
						</el-select>
					</div>
					<div>
						<label>麦克风</label>
						<el-select v-model="audio" placecholder="请选择">
							<el-option v-for="(item,index) in audioInput" :key="item" :label="item" :value="item"
								@click.native="audioName = item"></el-option>
						</el-select>
					</div>

					<button class="yk-next-btn" @click="checkDevices">下一步</button>
				</div>
			</div>
			<!-- 步骤一 摄像头和麦克风 结束 -->

			<!-- 步骤二 身份认证 开始 -->
			<div v-show="stepNumber == 2" class="yk-op-camera">
				<div class="yk-op-camera-item">
					<div class="yk-media" style="width: 20rem;height: 15rem;" ref="userMeida">
						<video width="320px" height="240px" muted ref="authVideo"></video>
					</div>
					<div class="yk-tips">
						<span v-if="isAuth" class="yk-auth-success">认证成功</span>
						<span v-else>请正脸面对摄像头</span>
					</div>
					<div class="yk-checkExam">
						<span>选择考试：</span>
						<el-select v-model="examId">
							<el-option v-for="(item,index) in examList" :label="item.name" :value="item.id"></el-option>
						</el-select>
					</div>
				</div>
				<button class="yk-next-btn" @click="checkAuth">下一步</button>
			</div>
			<!-- 步骤二 身份认证 结束 -->

			<!-- 步骤三 屏幕录制 开始 -->
			<div v-show="stepNumber == 3" class="yk-op-camera">
				<div class="yk-op-camera-item">
					<div class="yk-media" style="width: 20rem;height: 15rem;">
						<video width="320px" height="240px" muted ref="screen"></video>
						<div class="yk-media-status">
							调试状态：
							<span :class="screenState == '正常' ? 'is-green' : ''">{{ screenState }}</span>
						</div>
					</div>
				</div>
				<button class="yk-next-btn" @click="stepNumber = 4">下一步</button>
			</div>
			<!-- 步骤三 屏幕录制 结束 -->

			<!-- 步骤四 进入等待室 开始 -->
			<div v-show="stepNumber == 4" class="yk-op-success">
				<el-result icon="success" title="设备调试完成" subTitle="请进入等待室静候考试开始">
					<template slot="extra">
						<el-button type="primary" size="medium" @click="jumpToWait">进入等待室</el-button>
					</template>
				</el-result>
			</div>
			<!-- 步骤四 进入等待室 结束 -->
		</div>



	</div>
</template>

<script>
	const $electron = global.elRequire('electron')

	import {
		getDevices
	} from '../utils/pushStream.js'
	import { createclipboardObserber } from '../utils/clipboard.js'

	export default {
		name: 'Process',

		data() {
			return {
				stepNumber: 1, //当前步骤
				form: {}, //考生信息表单
				state: '未检测到设备', //设备状态
				audioInput: [], //音频设备列表
				videoInput: [], //视频设备列表
				video: '', //视频设备id
				audio: '', //音频设备id
				audioName: '', //音频设备名称
				videoName: '', //视频设备名称
				screenState: '异常', //屏幕录制状态
				curSourceDeviceId: '', //当前的摄像头设备id
				isAuth: false, //是否身份认证成功
				timer: '', //定时器【定时发送给后端身份认证的截图】
				examId: '',	//考试id
				examList: [],	//考试列表
				lastDeviceList: [],	//上次的设备列表
			}
		},

		watch: {
			//监听当前的audio名称，因为之前使用vuex出现刷新后数据丢失的情况，所以暂时用localstorage存储保证可以使用
			audioName(newValue) {
				//this.$store.commit('setAudioInput', newValue)
				localStorage.setItem('AudioInput', newValue)
			},
			//监听当前的video名称
			videoName(newValue) {
				//this.$store.commit('setVideoInput', newValue)
				localStorage.setItem('VideoInput', newValue)
			},
			examId: {
				/* deep: true, */
				//监听考试id变化，开始人脸验证
				handler: function(value) {
					//存储当前考试id
					localStorage.setItem('examId', value)
					//创建定时器，定时截图发送给后端进行身份认证
					this.createTimer()
				}
			}
		},

		async created() {
			//修改窗口大小
			$electron.ipcRenderer.send('process-window')

			//获取所有设备
			let lastDeviceList = await this.getAllDevices()
			this.lastDeviceList = lastDeviceList
			
			//获取所有的考试
			this.getAllExam()
			
			//再次设置剪切板监听
			createclipboardObserber((text) => {
				//给后端发送动态
				this.sendEventMsg(11, '存在文字粘贴行为，粘贴内容为：' + text)
				//console.log('文字粘贴')
			})

		},

		mounted() {
			//初始化摄像头，麦克风
			//this.initvideo()
			//初始化屏幕录制
			this.initScreen()
			//初始化监听u盘
			//this.initHIDMonitor()
		},

		methods: {
			/**
			 * 向后端发送作弊事件
			 * @param {Number} type 作弊类型
			 * @param {Object} description 作弊描述
			 */
			sendEventMsg(type, description) {
				this.$http.post('/invigilate/event/', {
					eventType: type,
					description: description,
					examinationId: localStorage.getItem('examId'),
					status: 2
				})
				.then((res) => {
					
				})
				//todo 弹窗提醒用户请勿作弊
			},
			/**
			 * 改变摄像头
			 * @param {Object} item 选中的摄像头
			 */
			changeVideo(item) {
				this.videoName = item.name

				//切换界面显示的摄像头
				this.curSourceDeviceId = item.devicesId

				//切换设备，然后调换摄像头
				this.initvideo()
			},
			/**
			 * 确认身份认证成功
			 */
			checkAuth() {
				if(!this.isAuth) { //如果身份验证没通过，提示
					this.$message.error('身份验证未通过')
				} else if(!this.examId) {	//如果没有选择考试
					this.$message.error('请选择考试')
				} else {	//进入下一步
					this.stepNumber = 3
				}
			},
			//获取所有音视频设备
			async getAllDevices() {
				return new Promise(async (resolve, reject) => {
					//列出活跃的设备
					const devices = await getDevices()
					//摄像头和麦克风设备的列表
					this.videoInput = []
					this.audioInput = devices.audio

					//枚举出设备的id放入列表中
					navigator.mediaDevices.enumerateDevices()
						.then(devicesList => {
							let videoList = devices.video
							//这里操作是因为用enumrateDevices获取的设备名称后面带一些奇怪的东西
							for (let i = 0; i < devicesList.length; i++) {
								for (let j = 0; j < videoList.length; j++) {
									if (devicesList[i].label.match(videoList[j]) && devicesList[i]
										.kind == 'videoinput') {
										this.videoInput.push({
											name: videoList[j],
											devicesId: devicesList[i].deviceId
										})
									}
								}
							}
							resolve(devicesList)
						})
				})

			},
			//获取所有HID设备
			initHIDMonitor() {
				const devices = navigator.hib.requestDevice({
					filters: []
				})
			},
			//初始化摄像头
			initvideo() {
				//初始化调摄像头
				const setting = {
					video: {
						deviceId: this.curSourceDeviceId
					},
					audio: true
				}

				//获取设备
				navigator.mediaDevices.getUserMedia(setting)
					.then(this.handleStream)
					.catch(this.handleError)
				//检测设备插拔
				navigator.mediaDevices.ondevicechange = async () => {
					//重新列举设备
					let curDeviceList = await this.getAllDevices()
					//对比两次设备差别
					if(!Object.is(this.lastDeviceList, curDeviceList)) {
						this.sendEventMsg(10, '检查到设备接入或拔除')
					}
					//重新检测设别
					this.initvideo()
				}
			},
			/**
			 * 处理获取视频stream流
			 * @param {Object} stream
			 */
			handleStream(stream) {
				//选中设备，修改当前设备状态
				this.state = '正常'
				//获取摄像头video元素
				let video = this.$refs.video
				//获取身份验证页面的video元素
				let authVideo = this.$refs.authVideo
				//设置video元素的srcObject
				video.srcObject = stream
				//设置身份验证界面video元素的srcObject
				authVideo.srcObject = stream
				//播放video元素
				video.play()
				//身份authvideo元素
				authVideo.play()
			},
			/**
			 * 处理摄像头异常事件
			 * @param {Object} err
			 */
			handleError(err) {
				//如果没有检测到设备
				this.state = '未检测到设备'
			},
			//初始化屏幕录制
			initScreen() {
				//获取播放屏幕得dom元素
				let screen = this.$refs.screen
				//判断当前屏幕使用是否有权限
				if (navigator.mediaDevices.getUserMedia) {
					//如果已有权限，获取屏幕内容
					navigator.mediaDevices.getUserMedia({
							audio: false, //不打开麦克风
							video: {
								mandatory: {
									chromeMediaSource: 'desktop'	//打开屏幕
								}
							}
						})
						.then((stream) => {
							//检测到设备
							//修改当前检测的设备状态
							this.screenState = '正常'
							//流赋值
							screen.srcObject = stream
							//实时播放屏幕内容
							screen.play()
						})
						.catch((err) => {
							//检测不到设备
							this.screenState = '无权限'
						})
				}
			},
			//跳转到等待室
			jumpToWait() {
				//关闭摄像头
				this.closeVideoDivice()
				//跳转路由至等待室
				this.$router.replace({ path: '/wait', query: { examId: this.examId } })
			},
			//关闭摄像头设备
			closeVideoDivice() {
				//获取播放摄像头得dom元素
				let videoElement = this.$refs.video

				//是否传入流
				if (!videoElement.srcObject) return;
				//获取流
				let stream = videoElement.srcObject
				//停止摄像头拉流
				let tracks = stream.getTracks()
				tracks.forEach(track => {
					track.stop()
				})
				//source置空
				videoElement.srcObject = null
			},
			/**
			 * 获取摄像头的截图
			 */
			getCaptrueByStream() {
				return new Promise((resolve, reject) => {
					//获取摄像头video元素
					const video = this.$refs.authVideo
					//创建一个canvas元素
					const _canvas = document.createElement('canvas')
					//设置canvas元素的宽高
					_canvas.width = 320
					_canvas.height = 240
					//获取canvas内容
					const ctx = _canvas.getContext('2d')
					//绘制canvas图片内容
					ctx.drawImage(video, 0, 0, _canvas.width, _canvas.height)
					//设置图片的格式，把图片内容转为路径
					const url_base64 = _canvas.toDataURL('image/png')
					//把图片路径转为文件发送给后端
					const file = this.dataURLToFile(url_base64, `${new Date().toISOString()}.png`)

					return resolve(url_base64)
				})
			},
			/**
			 * 把图片数据转成文件
			 * @param {String} dataUrl 图片数据
			 * @param {String} filename 文件名称
			 */
			dataURLToFile(dataUrl, filename) {
				//把内容划分
				var arr = dataUrl.split(','),
					mime = arr[0].match(/:(.*?);/)[1],
					bstr = atob(arr[1]),
					n = bstr.length,
					u8arr = new Uint8Array(n);
				//内容转码
				while (n--) {
					u8arr[n] = bstr.charCodeAt(n);
				}
				//创建文件
				this.fileList = new File([u8arr], filename, {
					type: mime
				});
				this.uploadAuthImg(this.fileList) //图片上传
				return new File([u8arr], filename, {
					type: mime
				});
			},
			/**
			 * 上传身份认证图片
			 * @param {Object} file 文件
			 */
			uploadAuthImg(file) {
				let param = new FormData(); //创建form对象
				param.append('file',file,file.name);//通过append向form对象添加数据  
				param.append('examId', this.examId)
				//向后端发送实时截图的人脸图片文件
				this.$http.post('/invigilate/invigilate/info/face', param, {
						transformRequest: function(data) {
							return data;
						},
						headers: {
							"Content-Type": 'multipart/form-data'
						}
					})
					.then((res) => {
						//如果发送成功
						if(res.data.code == 200 && res.data.data) {
							//修改当前认证状态
							this.isAuth = true
							
							//删除定时器
							clearInterval(this.timer)
							//删除定时器
							this.timer = null
						} else {
							//验证失败
							this.isAuth = false
						}
					})
			},
			/**
			 * 检查设备是否选中，进入下一步
			 */
			checkDevices() {
				if (this.video && this.audio) {
					//进入下一步
					this.stepNumber = 2
				} else {
					//todo 提醒动画
					this.$message.error('请选择设备')
				}
			},
			/**
			 * 创建定时器，发送图片
			 */
			async createTimer() {
				//设置定时器
				this.timer = setInterval(async () => {
					let result = await this.getCaptrueByStream()
				}, 1000)
			},
			/**
			 * 获取我的考试
			 */
			getAllExam() {
				this.$http.get('/examinations/examination/student/status/0', {
					params: {
						currentIndex: 1,
						pageSize: 100000
					}
				})
				.then(res => {
					//获取考试失败，提示
					if(res.data.code != 200) {
						this.$message.error('请检查网络设置')
					} else {
						this.examList = res.data.data.examinationDTOS
					}
				})
			}
		}
	}
</script>

<style scoped="scoped" lang="scss">
	.yk-steps {
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		transition: all .3s ease-in-out;
	}

	.yk-step-line {
		width: 15vw;
		background-color: $--border-color-base;
		height: 2px;
		margin: 0 8px;
	}

	.is-active-line {
		background-color: $--color-primary;
	}

	.yk-step-item {

		.yk-step-item__number {
			background-color: #dcdfe6;
			color: $--color-white;
			width: 23px;
			height: 23px;
			display: inline-block;
			text-align: center;
			border-radius: 100%;
			margin-right: 5px;
		}

		.is-active {
			background-color: $--color-primary;
		}
	}

	.yk-process {
		padding: 30px;
		height: 100%;
	}

	.yk-operation-container {
		padding: 5%;
		height: 100%;
	}

	.yk-op-fill {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		height: 65%;
	}

	.yk-next-btn {
		background-color: $--color-primary;
		cursor: pointer;
		color: $--color-white;
		width: 200px;
		height: 45px;
		border-color: #80b7ff;
		border-radius: $--border-radius-medium;
		border: none;
		transition: all .2s ease-in-out;
		position: absolute;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);

		&:focus {
			outline: none;
		}

		&:hover {
			background-color: mix($--color-white, $--color-primary, 30%) !important;
		}
	}

	.yk-op-camera {
		display: flex;
	}

	.yk-op-camera-item {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		div {
			margin: 5px 0;
		}

		label {
			margin-right: 10px;
		}
	}

	.yk-media {
		position: relative;
		border-radius: $--border-radius-medium;
		overflow: hidden;
		background-color: #ddd;
	}

	.yk-media-status {
		position: absolute;
		bottom: 0;
		background-color: #262649;
		opacity: 0.8;
		width: 100%;
		height: 35px;
		line-height: 35px;
		padding: 0 20px;
		color: $--color-white;
		font-size: $--font-size-base;
		margin: 0 !important;

		span {
			position: relative;
			margin-left: 20px;

			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: -20%;
				width: 8px;
				height: 8px;
				transform: translateY(-50%);
				background-color: #e0464f;
				border-radius: 100%;
			}
		}

		.is-green {

			&::after {
				left: -65%;
				background-color: #1ec58b !important;
			}
		}
	}

	.yk-op-screen {
		display: flex;
		justify-content: center;
		align-items: center;

		div {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}

	.yk-op-success {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.yk-tips {
		color: $--color-text-second;
	}

	.yk-auth-success {
		color: $--color-success !important;
	}
</style>
