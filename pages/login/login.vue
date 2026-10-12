<template>
	<view>
		<cu-custom bgColor="bg-blue" :isBack="false">
			<block slot="content">登录</block>
		</cu-custom>

		<form @submit="submitForm">
			<view class="padding-xs flex align-center">
				<view class="flex-sub text-center">
					<view class="text-xsl padding">
						<view class="cu-avatar xl round margin-left bg-grey">
							<text class="cuIcon-my"></text>
						</view>
					</view>
					<view class="text-bold text-lg">zeabur 后台</view>
				</view>
			</view>

			<view class="cu-form-group">
				<view class="title">账号</view>
				<input placeholder="请输入账号" v-model="username" />
			</view>
			<view class="cu-form-group">
				<view class="title">密码</view>
				<input placeholder="请输入密码" password v-model="password" />
			</view>

			<view class="padding flex flex-direction">
				<button class="cu-btn bg-blue margin-tb-sm lg round" form-type="submit" :disabled="loading">登 录</button>
			</view>
			<view class="text-center text-gray text-sm">默认账号 admin / 123456</view>
		</form>
	</view>
</template>

<script>
	import { post } from '@/common/request.js'
	import { setLogin, isLogin } from '@/common/auth.js'

	export default {
		data() {
			return {
				username: 'admin',
				password: '123456',
				loading: false
			}
		},
		onShow() {
			if (isLogin()) {
				uni.switchTab({ url: '/pages/index/index' })
			}
		},
		methods: {
			submitForm() {
				if (!this.username) {
					uni.showToast({ icon: 'none', title: '请输入账号' })
					return
				}
				if (!this.password) {
					uni.showToast({ icon: 'none', title: '请输入密码' })
					return
				}
				this.loading = true
				uni.showLoading({ title: '登录中', mask: true })
				post('/login/doLogin', {
					username: this.username,
					password: this.password
				}).then((res) => {
					uni.hideLoading()
					this.loading = false
					uni.showToast({ icon: 'none', title: res.msg || '登录完成' })
					if (res.code === 1) {
						setLogin(res.data.token, res.data.user)
						setTimeout(() => {
							uni.switchTab({ url: '/pages/index/index' })
						}, 400)
					}
				}).catch(() => {
					uni.hideLoading()
					this.loading = false
				})
			}
		}
	}
</script>
