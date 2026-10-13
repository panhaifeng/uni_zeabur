<template>
	<view class="page">
		<!-- 账号卡片：登录入口放这里，不再浮右下角 -->
		<view class="account-card" @tap="onAccountTap">
			<view class="avatar-wrap">
				<image class="avatar" :src="user.avatar || '/static/sample.jpg'" mode="aspectFill"></image>
			</view>
			<view class="account-info">
				<view class="account-name">{{ isGuest ? '游客模式' : (user.nickname || '微信用户') }}</view>
				<view class="account-desc">{{ isGuest ? '登录后可同步生词与战绩' : '已登录 · 数据已同步' }}</view>
			</view>
			<view class="account-action" v-if="isGuest">
				<text class="login-chip">微信登录</text>
			</view>
			<view class="account-action" v-else>
				<text class="arrow">›</text>
			</view>
		</view>

		<!-- 主视觉 -->
		<view class="hero-card">
			<view class="mole-emoji">🐹</view>
			<view class="title">单词打地鼠</view>
			<view class="subtitle">听发音 · 点释义 · 趣味练习</view>
			<button class="start-btn" @tap.stop="goSelect">开始挑战</button>
		</view>

		<!-- 快捷入口 -->
		<view class="quick-row">
			<view class="quick-item" @tap="goMine('word')">
				<view class="qi-icon word">📘</view>
				<view class="qi-title">生词本</view>
				<view class="qi-desc">错题复习</view>
			</view>
			<view class="quick-item" @tap="goMine('record')">
				<view class="qi-icon record">🏆</view>
				<view class="qi-title">我的战绩</view>
				<view class="qi-desc">历史对局</view>
			</view>
			<view class="quick-item" @tap="goMine('badge')">
				<view class="qi-icon badge">🎖️</view>
				<view class="qi-title">徽章</view>
				<view class="qi-desc">趣味荣誉</view>
			</view>
		</view>

		<!-- Banner 广告 -->
		<view class="ad-wrap">
			<!-- #ifdef MP-WEIXIN -->
			<ad v-if="adUnitId" :unit-id="adUnitId" ad-type="banner" @error="onAdError"></ad>
			<!-- #endif -->
		</view>

		<disclaimer />
	</view>
</template>

<script>
	import { get, post } from '@/common/request.js'
	import { ensureAnonymousId, setLogin } from '@/common/auth.js'
	import config from '@/common/config.js'
	import disclaimer from '@/components/disclaimer.vue'

	export default {
		components: { disclaimer },
		data() {
			return {
				user: {},
				isGuest: true,
				adUnitId: config.adBannerUnitId,
				logging: false
			}
		},
		onShow() {
			ensureAnonymousId()
			this.loadInfo()
		},
		methods: {
			loadInfo() {
				get('/user/get-info').then((res) => {
					if (res.code === 0 && res.data) {
						this.user = res.data.user || {}
						this.isGuest = !this.user.openid
						if (this.user.token) {
							setLogin(this.user.token, this.user)
						}
					}
				}).catch(() => {})
			},
			onAccountTap() {
				if (this.isGuest) {
					this.wxLogin()
				} else {
					uni.switchTab({ url: '/pages/mine/mine' })
				}
			},
			goSelect() {
				uni.navigateTo({ url: '/pages/select/select' })
			},
			goMine(tab) {
				uni.setStorageSync('mole_mine_tab', tab || 'word')
				uni.switchTab({ url: '/pages/mine/mine' })
			},
			wxLogin() {
				if (this.logging) return
				// #ifdef MP-WEIXIN
				this.logging = true
				uni.login({
					provider: 'weixin',
					success: (loginRes) => {
						if (!loginRes.code) {
							this.logging = false
							uni.showToast({ icon: 'none', title: '获取code失败' })
							return
						}
						uni.showLoading({ title: '登录中', mask: true })
						post('/user/wx-login', { code: loginRes.code }).then((res) => {
							uni.hideLoading()
							this.logging = false
							if (res.code === 0 && res.data && res.data.user) {
								setLogin(res.data.user.token, res.data.user)
								this.user = res.data.user
								this.isGuest = false
								uni.showToast({ icon: 'none', title: '登录成功' })
								if (!res.data.user.nickname || res.data.user.nickname === '微信用户') {
									uni.setStorageSync('mole_open_profile', 1)
									uni.switchTab({ url: '/pages/mine/mine' })
								}
							} else {
								uni.showToast({ icon: 'none', title: res.msg || '登录失败' })
							}
						}).catch(() => {
							uni.hideLoading()
							this.logging = false
						})
					},
					fail: () => {
						this.logging = false
						uni.showToast({ icon: 'none', title: '微信登录失败' })
					}
				})
				// #endif
				// #ifndef MP-WEIXIN
				uni.showToast({ icon: 'none', title: '请在微信小程序中登录' })
				// #endif
			},
			onAdError() {}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #d8f0dc 0%, #f3faf4 38%, #f7fbf8 100%);
		padding: 28rpx 28rpx 20rpx;
		box-sizing: border-box;
	}

	.account-card {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 24rpx;
		padding: 22rpx 24rpx;
		box-shadow: 0 8rpx 24rpx rgba(46, 125, 50, 0.08);
	}
	.avatar-wrap {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		overflow: hidden;
		background: #e8f5e9;
		flex-shrink: 0;
	}
	.avatar {
		width: 88rpx;
		height: 88rpx;
	}
	.account-info {
		flex: 1;
		margin-left: 20rpx;
		overflow: hidden;
	}
	.account-name {
		font-size: 30rpx;
		font-weight: 700;
		color: #1b5e20;
	}
	.account-desc {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #7a9a7d;
	}
	.login-chip {
		display: inline-block;
		padding: 10rpx 22rpx;
		border-radius: 999rpx;
		background: #07c160;
		color: #fff;
		font-size: 24rpx;
		font-weight: 600;
	}
	.arrow {
		font-size: 40rpx;
		color: #b0b0b0;
		line-height: 1;
	}

	.hero-card {
		margin-top: 28rpx;
		background: linear-gradient(145deg, #43a047 0%, #2e7d32 100%);
		border-radius: 28rpx;
		padding: 48rpx 36rpx 40rpx;
		text-align: center;
		box-shadow: 0 16rpx 36rpx rgba(46, 125, 50, 0.28);
		color: #fff;
	}
	.mole-emoji {
		font-size: 72rpx;
		line-height: 1;
		margin-bottom: 12rpx;
	}
	.title {
		font-size: 44rpx;
		font-weight: 800;
		letter-spacing: 2rpx;
	}
	.subtitle {
		margin-top: 12rpx;
		font-size: 26rpx;
		opacity: 0.9;
	}
	.start-btn {
		margin-top: 36rpx;
		width: 70%;
		height: 88rpx;
		line-height: 88rpx;
		background: #fff;
		color: #2e7d32;
		border-radius: 999rpx;
		font-size: 32rpx;
		font-weight: 700;
	}

	.quick-row {
		margin-top: 28rpx;
		display: flex;
		justify-content: space-between;
	}
	.quick-item {
		width: 31.5%;
		background: #fff;
		border-radius: 20rpx;
		padding: 28rpx 12rpx;
		text-align: center;
		box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.04);
	}
	.qi-icon {
		font-size: 40rpx;
		margin-bottom: 10rpx;
	}
	.qi-title {
		font-size: 26rpx;
		color: #2e7d32;
		font-weight: 700;
	}
	.qi-desc {
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #99a;
	}

	.ad-wrap {
		margin-top: 28rpx;
		min-height: 40rpx;
		border-radius: 16rpx;
		overflow: hidden;
	}
</style>
