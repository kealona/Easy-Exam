import Vue from 'vue'
import App from './App.vue'

import router from './router/index.js'
import store from './store/store.js'
import axios from './utils/request/axios.js'

import elementui from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false

Vue.prototype.$http = axios

Vue.use(router)
Vue.use(elementui)
Vue.use({
	install(Vue, options) {
		Vue.prototype.$electron = global.electron
	}
})

new Vue({
	router,
	store,
	render: h => h(App),
}).$mount('#app')
