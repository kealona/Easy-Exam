import Vue from "vue"
import Router from 'vue-router'

Vue.use(Router)

const Login = () => import("../pages/login.vue")
const Process = () => import("../pages/process.vue")
const Wait = () => import("../pages/wait.vue")
const Exam = () => import("../pages/exam.vue")

const router = new Router({
	mode: 'hash',
	base: process.env.BASE_URL,
	routes: [{
		path: '/',
		redirect: '/login'
	}, {
		path: '/login',
		component: Login
	}, {
		path: '/process',
		component: Process
	}, {
		path: '/wait',
		component: Wait
	}, {
		path: '/exam',
		component: Exam
	}]
})

export default router
