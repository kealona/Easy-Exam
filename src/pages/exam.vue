<template>
	<div class="yk-exam">
		<!-- 答题卡 开始 -->
		<div class="yk-answer" v-loading="loading">
			<p>答题卡</p>
			<div v-for="(item, index) in problems" :key="index">
				<span class="yk-answer-type">{{ item.type }}</span>
				<div class="yk-answer-list">
					<span class="yk-answer-item" v-for="(subject, num) in item.subjects" :key="num"
						:class="subject.state ? 'is-checked' : ''"
						@click="checkQuestionItem(num + 1, subject, index)">{{ num + 1 }}</span>
				</div>
			</div>
		</div>
		<!-- 答题卡 结束 -->

		<!-- 题目内容 开始 -->
		<div class="yk-subject" v-loading="loading">
			<div>
				<span class="yk-subject-num">{{ currentProblem.num }}.</span>
				<span style="font-weight: bold;line-height: 30px;">{{ currentProblem.content }}</span>
				<span class="yk-subject-type">{{ currentProblem.type }}</span>
			</div>
			<div>
				<div v-for="(item, index) in currentProblem.options" :key="item.value" class="yk-subject-option"
					@click="changeAnswer(index, currentProblem.type, currentProblem.id)">
					<span class="yk-subject-value" :class="item.checked ? 'is-selected' : ''">{{ item.value }}</span>
					<span class="yk-subject-answer">{{ item.answer }}</span>
				</div>
			</div>
			<!-- 填空题填写区域 开始 -->
			<div>
				<div v-for="(item, index) in currentProblem.vacany" :key="index" class="yk-subject-vacany">
					<el-input v-model="item.value" @blur="changeVacanyAns(currentProblem.vacany)">
						<template slot="prepend">第{{ index + 1 }}空</template>
					</el-input>
				</div>
			</div>
			<!-- 填空题填写区域 结束 -->
			<div v-if="currentProblem.type === '问答题'">
				<el-input type="textarea" v-model="currentProblem.ans" @blur="changeQAans(currentProblem)"></el-input>
			</div>
			<button class="yk-pre-btn" @click="lastQuestion" v-if="hasLastBtn">上一题</button>
			<button class="yk-next-btn" @click="nextQuestion" v-if="hasNextBtn">下一题</button>
		</div>
		<!-- 题目内容 结束 -->

		<!-- 考试其他信息 开始 -->
		<div class="yk-info" ref="container">
			<!-- 倒计时和做题进度 -->
			<div class="yk-timer-box">
				<p>距离考试结束还有</p>
				<span class="yk-timer">{{ minute }} : {{ second }}</span>
				<p class="yk-info-title">当前进度</p>
				<span class="yk-process">{{ currentNumber }}/{{ totalNumber }}</span>
				<el-progress :percentage="process" :show-text="false" style="width: 11vw;"></el-progress>
			</div>

			<!-- 摄像头实施拍摄显示 -->
			<!-- <div class="yk-video">
				<video :width="videoWidth" :height="videoWidth / 1.33" muted ref="video"></video>
			</div> -->
			<div>
				<button class="yk-button" @click="overExam">结束考试</button>
			</div>
		</div>
		<!-- 考试其他信息 结束 -->
	</div>
</template>

<script>
	const $electron = global.elRequire('electron')
	import {
		viewProcessMessage
	} from '../utils/process.js'
	import {
		pushStream
	} from '../utils/pushStream.js'
	import {
		initWsCollection
	} from '../utils/request/ws.js'

	const questionType = ['', '单选题', '多选题', '判断题', '填空题', '问答题']

	export default {
		name: 'Exam',

		data() {
			return {
				problems: [], //答题卡数据
				currentProblem: {}, //当前题目内容
				timer: '', //考试倒计时的计时器
				minutes: 0, //考试倒计时，分钟
				seconds: 0, //考试倒计时，秒
				videoWidth: 0, //视频dom的宽度
				currentIndex: {
					problemIndex: 0, //题型index
					subjectIndex: 0, //试题index
				}, //选择的答题卡index
				totalNumber: 0, //总题数
				currentNumber: 0, //当前做的题目数量
				process: 0, //当前做题的进度
				hasLastBtn: true, //是否有【上一题】按钮
				hasNextBtn: true, //是否有【下一题】按钮
				loading: true, //是否在加载中
			}
		},

		computed: {
			//分钟倒计时
			minute() {
				return this.formateNum(this.minutes)
			},
			//秒数倒计时
			second() {
				return this.formateNum(this.seconds)
			},
			/* //计算考试剩余时间
			remainTime() {
				return 600
			} */
		},

		watch: {
			//监听秒数变化，格式化时间
			second: {
				handler(newValue) {
					this.formateNum(newValue)
				}
			},
			//监听分钟变化，格式化数据
			minute: {
				handler(newValue) {
					this.formateNum(newValue)
				}
			},
			//监听当前选中题目的变化
			currentIndex: {
				handler: function(newValue) {
					//如果已经在第一题，那么没有【上一题】按钮
					if (newValue.problemIndex == 0 && newValue.subjectIndex == 0) {
						this.hasLastBtn = false
					} else {
						this.hasLastBtn = true
					}
					//如果已经在最后一题，那么没有【下一题】按钮
					if (newValue.problemIndex == this.problems.length - 1 && newValue.subjectIndex == this.problems[
							newValue.problemIndex].subjects.length - 1) {
						this.hasNextBtn = false
					} else {
						this.hasNextBtn = true
					}
				}
			}
		},

		created() {
			//调整至屏幕全屏，调用electron的调整串口事件
			$electron.ipcRenderer.send('exam-window')

			//获取试卷信息的接口
			let {
				paperId,
				endTime,
				examId
			} = this.$route.query
			this.getPaperInfoById(paperId)
			this.examId = examId

			//计算距离考试结束还有多久
			let end = new Date(endTime)
			let nowTime = new Date()
			let remainTime = (end - nowTime) / 1000

			//初始化倒计时器
			if (remainTime > 0) {
				this.minutes = Math.floor(remainTime / 60) % 60
				this.seconds = Math.floor(remainTime % 60)
				this.countDown()
			}

			//创建websocket连接
			this.createWebsocketCollection(examId)
			
			//开始考试
			this.startExam()
		},

		async mounted() {
			//获取视频和音频的dom
			const videoName = this.$store.state.videoInput
			const audioName = this.$store.state.audioInput
			//遍历所有进程
			viewProcessMessage()
			this.videoWidth = document.body.clientWidth / 5
			//开始摄像头推流
			const videoInput = this.$store.state.videoInput || localStorage.getItem('VideoInput')
			const audioInput = this.$store.state.audioInput || localStorage.getItem('AudioInput')
			//获取推流密钥
			let keys = await this.getPushKey()
			
			//开始摄像头推流
			pushStream(videoInput, audioInput, keys.cameraKey, (commandLine) => {
				console.log(`${new Date()}video is pushing`)
				console.log(`${commandLine}`)
				//开始AI监控
				this.$http.post(`/invigilate/invigilate/start/screenshot/${this.examId}`)
					.then((res) => {
						if (res.data.code != 200) {
							this.$messge.error('请检查设备')
						}
					})
			})
			//开始屏幕推流
			pushStream('desktop', '', keys.invigilateKey, function(commandLine) {
				console.log(`${new Date()}desktop is pushing`)
				console.log(`${commandLine}`)
			})
		},

		methods: {
			/**
			 * 获取试卷信息
			 * @param {String} paperId 试卷id
			 */
			getPaperInfoById(paperId) {
				this.$http.get(`/paper/paper/paper/student/${paperId}`)
					.then(async (res) => {
						if (res.data.code != 200) {
							this.$message.error('请检查网络设置')
						} else {
							//格式化试题列表
							await this.formatQuestionList(res.data.data.questionData)
							//初始化第一题
							this.checkQuestionItem(1, this.problems[0].subjects[0], 0)
							//加载完毕，关闭加载动画
							this.loading = false
						}
					})
			},
			/**
			 * 点击结束考试
			 */
			overExam() {
				//发起对话框，确认是否结束考试
				this.$confirm('您是否要交卷结束考试', '提示', {
					confirmButtonText: '结束考试',
					cancelButtonText: '取消',
					type: 'warning'
				}).then(() => {
					//如果用户确认结束考试，向后端发起请求修改考生状态
					this.$http.get('/examinations/examination/exam/end/' + this.examId)
						.then((res) => {
							if (res.data.code != 200) {
								this.$message.error(res.data.message)
							} else {
								//关闭窗口
								$electron.ipcRenderer.send('window-close')
							}
						})
				})

			},
			/**
			 * 创建websocket连接
			 */
			createWebsocketCollection(examId) {
				//初始化ws连接
				initWsCollection((text) => {
					//接收到消息的回调
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
			/**
			 * 获取推流密钥
			 */
			getPushKey() {
				return new Promise((resolve, reject) => {
					//向后端请求密钥
					this.$http.get(`/invigilate/invigilate/key/${this.examId}`)
						.then((res) => {
							resolve(res.data.data)
						})
				})

			},
			/**
			 * 格式化试题列表
			 * @param {Array} list 试题列表
			 */
			formatQuestionList(list) {
				return new Promise((resolve, reject) => {
					let total = 0
					if (list.hasOwnProperty('1')) {
						this.problems.push({
							type: '单选题',
							subjects: list['1'].map((item) => {
								item.state = false
								total++
								return item
							})
						})
					}
					if (list.hasOwnProperty('2')) {
						this.problems.push({
							type: '多选题',
							subjects: list['2'].map((item) => {
								item.state = false
								total++
								return item
							})
						})
					}
					if (list.hasOwnProperty('3')) {
						this.problems.push({
							type: '判断题',
							subjects: list['3'].map((item) => {
								item.state = false
								total++
								return item
							})
						})
					}
					if (list.hasOwnProperty('4')) {
						this.problems.push({
							type: '填空题',
							subjects: list['4'].map((item) => {
								item.state = false
								total++
								return item
							})
						})
					}
					if (list.hasOwnProperty('5')) {
						this.problems.push({
							type: '问答题',
							subjects: list['5'].map((item) => {
								item.state = false
								total++
								return item
							})
						})
					}
					this.totalNumber = total
					resolve()
				})
			},
			/**
			 * 选中题目
			 * @param {Number} index 选中的序号
			 * @param {Object} info 题目数据
			 */
			checkQuestionItem(index, info, problemIndex) {
				//改变当前选中的index
				this.currentIndex = {
					problemIndex: problemIndex,
					subjectIndex: index - 1
				}
				//如果是填空题，分析题干有多少括号，判断应该有多少个空【需要填写的信息】
				if (info.questionType === 4) {
					let vacNumber = this.getVacany(info.questionText)
					//初始化填空题空数据
					let vacany = this.initVacanyData(vacNumber, this.problems[this.currentIndex.problemIndex].subjects[this
						.currentIndex.subjectIndex].ans)
					//更新当前试题的数据
					this.currentProblem = {
						num: index,
						content: info.questionText,
						vacany: vacany,
						type: questionType[info.questionType],
						id: info.questionId
					}
				} else if (info.questionType === 5) {
					let ans = this.problems[this.currentIndex.problemIndex].subjects[this
						.currentIndex.subjectIndex].ans
					//更新当前试题的数据
					this.currentProblem = {
						num: index,
						content: info.questionText,
						ans: ans,
						type: questionType[info.questionType],
						id: info.questionId
					}
				} else {
					//更新当前试题的数据
					this.currentProblem = {
						num: index,
						content: info.questionText,
						options: this.formatOptions(info.options, info.ans),
						isCheck: info.state,
						type: questionType[info.questionType],
						id: info.questionId
					}
				}

			},
			/**
			 * 初始化填空题答案
			 * @param {Number} len 空数量
			 * @param {String} data 答案
			 */
			initVacanyData(len, data) {
				//设置填空题空格的内容
				let vacany = []
				if (data) {
					let ansList = data.split('|')
					for (let i = 0; i < len; i++) {
						vacany.push({
							value: ansList[i]
						})
					}
				} else {
					for (let i = 0; i < len; i++) {
						vacany.push({
							value: ''
						})
					}
				}
				return vacany
			},
			/**
			 * 判断是字符串中有几对括号
			 * @param {String} str 字符串
			 */
			getVacany(str) {
				//括号数量
				let num = 0
				//遍历总共有几个括号
				for (let i = 0; i < str.length; i++) {
					if (i != str.length - 1 && str[i] == '(' && str[i + 1] == ')') {
						num++
					}
					if (i != str.length - 1 && str[i] == '（' && str[i + 1] == '）') {
						num++
					}
					if (i != str.length - 1 && str[i] == '（' && str[i + 1] == ')') {
						num++
					}
					if (i != str.length - 1 && str[i] == '(' && str[i + 1] == '）') {
						num++
					}
				}
				return num
			},
			/**
			 * 修改填空题答案
			 * @param {Object} info 填空题数据
			 */
			changeVacanyAns(info) {
				//拼接填空题答案
				let ans = ''
				for (let i = 0; i < info.length; i++) {
					ans += info[i].value
					if (i != info.length - 1) {
						ans += '|'
					}
				}
				//刷新填空题答案
				this.problems[this.currentIndex.problemIndex].subjects[this.currentIndex.subjectIndex]
					.ans = ans
			},
			/**
			 * 修改问答题的答案
			 * @param {Object} info 问答题数据
			 */
			changeQAans(info) {
				//刷新填空题答案
				this.problems[this.currentIndex.problemIndex].subjects[this.currentIndex.subjectIndex]
					.ans = info.ans
			},
			/**
			 * 格式化选项
			 * @param {Object} options 选项
			 * @param {String} ans 答案
			 */
			formatOptions(options, ans) {
				//选项数组
				let result = []
				//遍历把数组放到选项中
				for (let item in options) {
					//判断选项是否被选中
					if (ans && ans.indexOf(item) !== -1) {
						result.push({
							value: item,
							answer: options[item],
							checked: true
						})
					} else {
						result.push({
							value: item,
							answer: options[item],
							checked: false
						})
					}

				}
				return result
			},
			/**
			 * 点击下一题
			 */
			nextQuestion() {
				//判断当前题型是否已经遍历完
				if (this.problems[this.currentIndex.problemIndex].subjects.length - 1 == this.currentIndex.subjectIndex) {
					//如果遍历完，则跳到下一个题型遍历
					this.currentIndex = {
						problemIndex: this.currentIndex.problemIndex + 1,
						subjectIndex: 0
					}
					//强刷，不更新
					this.$forceUpdate()
				} else {
					//下一个试题
					this.currentIndex.subjectIndex++
				}
				//更新当前选中的题目
				this.checkQuestionItem(this.currentIndex.subjectIndex + 1, this.problems[this.currentIndex.problemIndex]
					.subjects[this.currentIndex.subjectIndex], this.currentIndex.problemIndex)
			},
			/**
			 * 点击上一题
			 */
			lastQuestion() {
				//判断当前题型是否是第一个试题 && 当前题型选中的题号是否是第一题
				if (this.currentIndex.subjectIndex == 0 && this.currentIndex.problemIndex != 0) {
					//如果遍历完，则跳到下一个题型遍历
					this.currentIndex = {
						problemIndex: this.currentIndex.problemIndex - 1,
						subjectIndex: this.problems[this.currentIndex.problemIndex - 1].subjects.length - 1
					}
					//不更新，强刷
					this.$forceUpdate()
				} else {
					//上一个试题
					this.currentIndex.subjectIndex--
				}
				//更新当前选中的题目
				this.checkQuestionItem(this.currentIndex.subjectIndex + 1, this.problems[this.currentIndex.problemIndex]
					.subjects[this.currentIndex.subjectIndex], this.currentIndex.problemIndex)
			},
			/**
			 * 改变当前题目的选中答案
			 * @param {Number} valueIndex 改为第几个答案
			 * @param {String} type 试题类型
			 */
			async changeAnswer(valueIndex, type, id) {
				//获取当前问题的所有选项
				let answers = this.currentProblem.options
				//如果没有选中过，则改变当前做题进度
				let flag = await this.isChecked(answers)

				if (!flag) {
					//改变进度数字
					this.currentNumber++
					//改变进度条长度
					this.process = this.currentNumber / this.totalNumber * 100
				}
				//格式化答案
				let ans = this.formatAns(type, answers, valueIndex)
				//答题卡状态改变
				this.problems[this.currentIndex.problemIndex].subjects[this.currentIndex.subjectIndex].state = true
				//向后端录入答案
				this.setAns(ans, id)
			},
			/**
			 * 设置答案
			 * @param {Object} ans 答案内容
			 * @param {Object} id 选项id
			 */
			setAns(ans, id) {
				//console.log(id)
				//设置请求body
				let userAnswerData = {
					answers: ans,
					questionId: id
				}
				this.$http.post('/examinations/examination/answer', {
						examinationId: this.examId,
						userAnswerData: userAnswerData
					})
					.then((res) => {

					})
			},
			/**
			 * 根据题型格式化答案
			 * @param {String} type 题型
			 * @param {Array} list 选项列表
			 * @param {String} curCheckIndex 当前选中index
			 */
			formatAns(type, list, curCheckIndex) {
				let ans
				if (type === '单选题') {
					//遍历所有选项，改变选中的答案
					list.map((item, index) => {
						//如果遍历到用户选中的选项，就该改变选项选中的状态
						if (index == curCheckIndex) {
							item.checked = true
							//记录当前答案
							this.problems[this.currentIndex.problemIndex].subjects[this.currentIndex.subjectIndex]
								.ans = item.value
							ans = item.value
						} else {
							item.checked = false
						}
						return item
					})
				} else if (type === '多选题') {
					//遍历选项
					list.map((item, index) => {
						//如果遍历到用户选中的选项，就该改变选项选中的状态
						if (index == curCheckIndex) {
							item.checked = !item.checked
						}
						return item
					})
					ans = ''
					for (let item of list) {
						if (item.checked) {
							ans += item.value
						}
					}
					//更新并记录试题答案
					this.problems[this.currentIndex.problemIndex].subjects[this.currentIndex.subjectIndex]
						.ans = ans
				}
				return ans
			},
			/**
			 * 检查当前选项中是否有被选中的答案
			 * @param {Array} list
			 */
			isChecked(list) {
				return new Promise((resolve, reject) => {
					for (let i = 0; i < list.length; i++) {
						if (list[i].checked) {
							resolve(true)
						}
					}
					resolve(false)
				})

			},
			/**
			 * 格式化时间
			 * @param {Number} num 当前的分钟数或者秒数
			 */
			formateNum(num) {
				//如果数字小于10，则在数字前加个0
				return num < 10 ? '0' + num : '' + num
			},
			/**
			 * 创建一个定时器
			 */
			countDown() {
				//先清空倒计时
				clearInterval(this.timer)
				this.timer = setInterval(() => {
					//倒计时结束，清除定时器，可以进入考试
					if (this.minutes === 0 && this.seconds === 0) {
						//清除定时器
						clearInterval(this.timer)
					} else if (this.minutes != 0 && this.seconds == 0) {
						//如果分钟还没有数完，分钟-1，秒数拉满
						this.minutes -= 1
						this.seconds = 59
					} else {
						//秒数没数万，秒数-1
						this.seconds -= 1
					}
				}, 1000)
			}
		}
	}
</script>

<style scoped="scoped" lang="scss">
	.yk-exam {
		display: flex;
		padding: 30px;
		background-color: $--color-background;
		height: 100%;
	}

	.yk-answer {
		flex: 1;
		background-color: $--color-white;
		border-radius: $--border-radius-large;
		padding: 20px;
		margin-right: 15px;

		p {
			font-size: 18px;
			border-bottom: $--border-base;
			padding: 10px 0;
			position: relative;
			font-weight: bold;
			text-align: center;
		}
	}

	.yk-answer-type {
		font-weight: bold;
		display: block;
		margin-bottom: 10px;
	}

	.yk-answer-list {
		display: grid;
		grid-template-columns: repeat(5, 20%);
	}

	.yk-answer-item {
		background-color: #eff3f6;
		color: $--color-text-fourth;
		border: 1px solid #d5d5d5;
		width: 30px;
		height: 30px;
		border-radius: $--border-radius-medium;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 10px;
		cursor: pointer;
		transition: all .2s ease;
		box-sizing: border-box;
	}

	.is-checked {
		background-color: #d2eafe;
		border-color: #69b0e6;
		color: #69b0e6;
	}

	.yk-subject {
		flex: 3;
		background-color: $--color-white;
		border-radius: $--border-radius-large;
		padding: 40px;
	}

	.yk-subject-num {
		color: $--color-primary;
		margin-right: 10px;
	}

	.yk-subject-type {
		font-size: $--font-size-small;
		background-color: #eef2f5;
		padding: 5px 10px;
		border-radius: $--border-radius-medium;
		margin-left: 10px;
		display: inline-block;
	}

	.yk-subject-option {
		margin: 10px 0;
		height: 30px;
		display: flex;
		align-items: center;
		padding: 5px;
		cursor: pointer;
		border-radius: 4px;
		/* transition: all .3s ease; */

		&:hover {
			background-color: #f6fafc;
		}
	}

	.yk-subject-value {
		height: 25px;
		width: 25px;
		border-radius: 100%;
		background-color: #eef2f5;
		color: $--color-text-fourth;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-right: 10px;
	}

	.is-selected {
		background-color: $--color-primary;
		color: #fff;
	}

	.yk-pre-btn {
		background-color: #fff;
		cursor: pointer;
		color: $--color-text-second;
		width: 100px;
		height: 45px;
		border: $--border-base;
		border-radius: $--border-radius-medium;
		transition: all .15s ease-in-out;
		transform: translateX(-50%);
		margin: 20px 10px 20px 50px;
		box-sizing: border-box;

		&:focus {
			outline: none;
		}

		&:hover {
			background-color: #d1e9fd !important;
		}

	}

	.yk-next-btn {
		background-color: $--color-primary;
		cursor: pointer;
		color: #fff;
		width: 100px;
		height: 45px;
		border: none;
		border-radius: $--border-radius-medium;
		transition: all .15s ease-in-out;
		transform: translateX(-50%);
		margin: 20px 10px 20px 20px;
		box-sizing: border-box;

		&:focus {
			outline: none;
		}

		&:hover {
			background-color: mix($--color-white, $--color-primary, 30%) !important;
		}

	}

	.yk-info {
		flex: 1;
		margin-left: 15px;
	}

	.yk-info-title {
		margin-top: 15px !important;
	}

	.yk-timer-box {
		background-color: $--color-white;
		border-radius: $--border-radius-large;
		padding: 40px;
		display: flex;
		align-items: center;
		flex-direction: column;

		p {
			margin: 0;
			font-size: 18px;
			font-weight: 600;
		}
	}

	.yk-timer {
		color: $--color-primary;
		font-size: 35px;
	}

	.yk-process {
		display: block;
		margin: 7px 0;
	}

	.yk-video {
		border-radius: $--border-radius-medium;
		overflow: hidden;
		margin-top: 20px;
	}

	.yk-button {
		background-color: $--color-danger;
		color: $--color-white;
		width: 100%;
		margin: 20px 0;
		height: 50px;
		border-radius: $--border-radius-medium;
		border: none;
		font-size: $--font-size-base;
		cursor: pointer;
		transition: all .3s ease-in-out;

		&:hover {
			background-color: mix(#fff, $--color-danger, 20%);
		}
	}
</style>
