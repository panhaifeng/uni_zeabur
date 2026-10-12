<template>
	<view>
		<cu-custom bgColor="bg-blue" :isBack="true">
			<block slot="backText">返回</block>
			<block slot="content">系统配置</block>
		</cu-custom>

		<form @submit="saveConfig">
			<view class="cu-form-group margin-top">
				<view class="title">站点名称</view>
				<input v-model="site_name" placeholder="请输入站点名称" />
			</view>
			<view class="cu-form-group">
				<view class="title">系统公告</view>
				<input v-model="site_notice" placeholder="请输入系统公告" />
			</view>
			<view class="padding flex flex-direction">
				<button class="cu-btn bg-blue lg round" form-type="submit">保存</button>
			</view>
		</form>
	</view>
</template>

<script>
	import { get, post } from '@/common/request.js'
	import { isLogin } from '@/common/auth.js'

	export default {
		data() {
			return {
				site_name: '',
				site_notice: ''
			}
		},
		onShow() {
			if (!isLogin()) {
				uni.reLaunch({ url: '/pages/login/login' })
				return
			}
			this.loadData()
		},
		methods: {
			loadData() {
				get('/config/index').then((res) => {
					if (res.code === 1 && res.data) {
						this.site_name = res.data.site_name || ''
						this.site_notice = res.data.site_notice || ''
					}
				})
			},
			saveConfig() {
				if (!this.site_name) {
					uni.showToast({ icon: 'none', title: '请输入站点名称' })
					return
				}
				uni.showLoading({ title: '保存中', mask: true })
				post('/config/save', {
					site_name: this.site_name,
					site_notice: this.site_notice
				}).then((res) => {
					uni.hideLoading()
					uni.showToast({ icon: 'none', title: res.msg || '已保存' })
				}).catch(() => {
					uni.hideLoading()
				})
			}
		}
	}
</script>
