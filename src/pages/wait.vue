<template>
	<div>
		<div class="yk-wait-title">
			<span>{{ examInfo.examinationName }}</span>
		</div>
		<div class="yk-wait-container">
			<div class="yk-wait-instructions">
				<p>考试须知</p>
				<span>
					{{ examInfo.introduction }}
				</span>
			</div>
		</div>
		<div class="yk-exam-time">
			<button class="yk-button" v-if="isAccess" @click="jumpToExam">开始考试</button>
			<div v-else>
				<p>
					距离考试开始还有：
					<span>{{ minute }} : {{ second }}</span>
				</p>
			</div>
		</div>

	</div>
</template>

<script>
	import {
		initWsCollection
	} from '../utils/request/ws.js'
	const {
		dialog
	} = global.elRequire('electron')

	export default {
		name: 'Wait',

		data() {
			return {
				examName: '2022年高级软件工程师考试', //考试名称
				instructions: ``, //考试须知
				isAccess: false, //是否可以进入考试
				minutes: 0,	//分钟
				seconds: 0,	//秒数
				remainTime: 5,	//剩余时间
				startTime: '', //考试开始时间
				endTime: '', //考试结束时间
				timer: '', //倒计时定时器
				examInfo: {}, //考试信息
				examId: 0, //考试id
			}
		},

		computed: {
			//分钟倒计时
			minute() {
				//格式化【不足10在前面加0】
				return this.formateNum(this.minutes)
			},
			//秒数倒计时
			second() {
				//格式化【不足10在前面加0】
				return this.formateNum(this.seconds)
			},
			/* //计算考试剩余时间
			remainTime() {
				let start = new Date(this.startTime)
				let nowTime = new Date().getTime()
				return (nowTime - start) / 1000
			} */
		},

		watch: {
			//监听秒数变化
			second: {
				handler(newValue) {
					this.formateNum(newValue)
				}
			},
			//监听分钟变化
			minute: {
				handler(newValue) {
					this.formateNum(newValue)
				}
			}
		},

		created() {
			//获取考试信息
			let {
				examId
			} = this.$route.query
			//创建持久连接
			localStorage.setItem('examId', examId)
			this.createWebsocketCollection(examId)
			this.examId = examId
			//获取考试信息
			this.getEaxamInfo()
		},

		mounted() {

		},

		methods: {
			/**
			 * 获取考试信息
			 */
			getEaxamInfo() {
				this.$http.get(`/examinations/examination/id/${this.examId}`)
					.then((res) => {
						if (res.data.code != 200) {
							this.$message.error('请检查网络设置')
						} else {
							//设置考试信息
							this.examInfo = res.data.data
							//设置考试开始时间
							this.startTime = res.data.data.startTime
							//设置考试结束时间
							this.endTime = res.data.data.endTime
							//设置试卷id
							this.paperId = res.data.data.paperId
							//创建考试开始时间日期实例
							let start = new Date(this.startTime)
							//创建当前时间的日期实例
							let nowTime = new Date()
							//设置当前距离考试结束还有多少时间
							this.remainTime = (start - nowTime) / 1000

							//初始化倒计时器
							if (this.remainTime > 0) {
								//分钟和秒数向上取整
								this.minutes = Math.floor(this.remainTime / 60) % 60
								this.seconds = Math.floor(this.remainTime % 60)
								//设置定时器
								this.countDown()
							} else {
								//如果已经到开考时间，可见【开始考试】按钮
								this.isAccess = true
							}
						}
					})
			},
			/**
			 * 创建websocket连接
			 */
			createWebsocketCollection(examId) {
				//初始化ws连接
				initWsCollection((text) => {
					//接收到消息的回调
					//console.log(text)
					if (text.type == 2) {
						this.$alert(text.data, '警告', {
							confirmButtonText: '确定',
							callback: action => {
								/* this.$message({
									type: 'info',
									message: `action: ${ action }`
								}); */
							}
						});
					}

				})
			},
			//格式化时间
			formateNum(num) {
				//不足10补0
				return num < 10 ? '0' + num : '' + num
			},
			//设置定时器
			countDown() {
				//清除定时器。重新设置一个定时器
				clearInterval(this.timer)
				//设置定时器
				this.timer = setInterval(() => {
					//倒计时结束，清除定时器，可以进入考试
					if (this.minutes == 0 && this.seconds == 0) {
						//显示【进入考试】按钮
						this.isAccess = true
						//清除定时器
						clearInterval(this.timer)
					} else if (this.minutes != 0 && this.seconds == 0) {
						//如果秒数为0，但分钟不为0，秒数重新计算
						this.minutes -= 1
						this.seconds = 59
					} else {
						//秒数没数完，秒数-1
						this.seconds -= 1
					}
				}, 1000)
			},
			//跳转到考试界面
			jumpToExam() {
				//跳转到考试界面
				this.$router.replace({
					path: '/exam',
					query: {
						paperId: this.paperId,
						endTime: this.endTime,
						examId: this.examId
					}
				})
			}
		}
	}
</script>

<style scoped="scoped" lang="scss">
	.yk-wait-title {
		font-size: 25px;
		color: $--color-white;
		background-color: $--color-primary;
		font-weight: lighter;
		width: 100%;
		height: 75px;
		line-height: 75px;
		text-align: center;
	}

	.yk-wait-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 65vh;
	}

	.yk-wait-instructions {
		border: 1px solid #faad14;
		border-radius: $--border-radius-large;
		width: 50%;
		padding: 20px;
		/* box-shadow: $--shadow-primary; */
		background-color: #fffbe6;

		p {
			text-align: center;
			font-size: 19px;
		}

		span {
			word-wrap: wrap;
		}
	}

	.yk-exam-time {
		display: flex;
		justify-content: center;

		span {
			font-weight: bold;
		}

	}

	.yk-button {
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
</style>
