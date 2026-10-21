import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

// 右上角「转发给朋友」。自定义导航页也要主动打开分享菜单
// #ifdef MP-WEIXIN
Vue.mixin({
	onShow() {
		uni.showShareMenu({
			withShareTicket: false,
			menus: ['shareAppMessage']
		})
	},
	onShareAppMessage() {
		return {
			title: '单词打地鼠 · 听发音点释义',
			path: '/pages/index/index'
		}
	}
})
// #endif

App.mpType = 'app'

const app = new Vue({
	...App
})
app.$mount()
