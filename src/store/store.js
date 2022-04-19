import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
	state() {
		return {
			videoInput: '',//视频输入设备名称
			audioInput: ''	//音频输入设备名称
		}
	},
	mutations: {
		/**
		 * 选中视频输入设备
		 * @param {Object} state
		 * @param {String} deviceName 设备名称
		 */
		setVideoInput (state, deviceName) {
			state.videoInput = deviceName
		},
		/**
		 * 选中音频输入设备
		 * @param {Object} state
		 * @param {String} deviceName 设备名称
		 */
		setAudioInput (state, deviceName) {
			state.audioInput = deviceName
		}
	}
})