<template>
	<view class="page">
		<view class="bg-blob bg-blob-a"></view>
		<view class="bg-blob bg-blob-b"></view>

		<!-- 自定义顶部导航，避开原生标题样式限制 -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
				<view class="nav-brand">
					<text class="nav-mark">🐹</text>
					<text class="nav-title">单词打地鼠</text>
				</view>
			</view>
		</view>

		<view class="page-body">
			<view class="space-top"></view>

			<!-- 账号卡片 -->
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

			<view class="space-gap"></view>

			<!-- 主视觉：占页中主要视觉权重 -->
			<view class="hero-card">
				<view class="hero-deco hero-deco-1"></view>
				<view class="hero-deco hero-deco-2"></view>
				<view class="mole-badge">🐹</view>
				<view class="title">单词打地鼠</view>
				<view class="subtitle">听发音 · 点释义 · 趣味练习</view>
				<button class="start-btn" @tap.stop="goSelect">开始挑战</button>
				<view class="hero-hint">选词库 · 选难度 · 立即开玩</view>
			</view>

			<view class="space-gap space-gap-lg"></view>

			<!-- 快捷入口：三块独立功能卡 -->
			<view class="feature-grid">
				<view class="feature-card word" @tap="goMine('word')">
					<view class="feature-icon">📘</view>
					<view class="feature-title">生词本</view>
					<view class="feature-desc">错题复习</view>
				</view>
				<view class="feature-card record" @tap="goMine('record')">
					<view class="feature-icon">🏆</view>
					<view class="feature-title">战绩</view>
					<view class="feature-desc">历史对局</view>
				</view>
				<view class="feature-card badge" @tap="goMine('badge')">
					<view class="feature-icon">🎖️</view>
					<view class="feature-title">徽章</view>
					<view class="feature-desc">趣味荣誉</view>
				</view>
			</view>

			<!-- Banner 广告 -->
			<view class="ad-wrap" v-if="adUnitId">
				<!-- #ifdef MP-WEIXIN -->
				<ad :unit-id="adUnitId" ad-type="banner" @error="onAdError"></ad>
				<!-- #endif -->
			</view>

			<view class="space-bottom"></view>
		</view>

		<view class="page-foot">
			<disclaimer />
		</view>
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
				logging: false,
				statusBarHeight: 20,
				navBarHeight: 44
			}
		},
		onLoad() {
			this.initNav()
		},
		onShow() {
			ensureAnonymousId()
			this.loadInfo()
		},
		methods: {
			initNav() {
				try {
					const sys = uni.getSystemInfoSync()
					this.statusBarHeight = sys.statusBarHeight || 20
					// #ifdef MP-WEIXIN
					const menu = uni.getMenuButtonBoundingClientRect()
					if (menu && menu.height) {
						this.navBarHeight = (menu.top - this.statusBarHeight) * 2 + menu.height
					} else {
						this.navBarHeight = 44
					}
					// #endif
					// #ifndef MP-WEIXIN
					this.navBarHeight = 44
					// #endif
				} catch (e) {
					this.statusBarHeight = 20
					this.navBarHeight = 44
				}
			},
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
		box-sizing: border-box;
		padding: 0 28rpx 0;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		background:
			radial-gradient(ellipse 80% 50% at 10% -10%, rgba(125, 206, 184, 0.35), transparent 55%),
			radial-gradient(ellipse 70% 45% at 100% 8%, rgba(168, 230, 207, 0.4), transparent 50%),
			linear-gradient(180deg, #E8F7F2 0%, #F0FAF6 42%, #F7FCFA 100%);
	}

	.nav-wrap {
		margin: 0 -28rpx;
		padding-left: 28rpx;
		padding-right: 28rpx;
		background: linear-gradient(180deg, rgba(93, 186, 157, 0.18) 0%, rgba(232, 247, 242, 0) 100%);
		position: relative;
		z-index: 2;
	}
	.nav-bar {
		display: flex;
		align-items: center;
		padding-right: 200rpx; /* 避开微信右上角胶囊 */
		box-sizing: border-box;
	}
	.nav-brand {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}
	.nav-mark {
		font-size: 34rpx;
		line-height: 1;
	}
	.nav-title {
		font-size: 36rpx;
		font-weight: 800;
		color: #2F8A74;
		letter-spacing: 4rpx;
		line-height: 1.2;
	}

	.bg-blob {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		filter: blur(2rpx);
		opacity: 0.45;
	}
	.bg-blob-a {
		width: 220rpx;
		height: 220rpx;
		right: -60rpx;
		top: 280rpx;
		background: rgba(125, 206, 184, 0.28);
	}
	.bg-blob-b {
		width: 180rpx;
		height: 180rpx;
		left: -50rpx;
		bottom: 220rpx;
		background: rgba(93, 186, 157, 0.16);
	}

	.page-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
	}
	.space-top {
		flex: 0.35;
		min-height: 28rpx;
	}
	.space-gap {
		flex: 0.55;
		min-height: 36rpx;
	}
	.space-gap-lg {
		flex: 0.75;
		min-height: 48rpx;
	}
	.space-bottom {
		flex: 0.9;
		min-height: 24rpx;
	}

	.account-card {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.94);
		border-radius: 28rpx;
		padding: 26rpx 28rpx;
		box-shadow: 0 10rpx 28rpx rgba(93, 186, 157, 0.1);
		border: 1rpx solid rgba(255, 255, 255, 0.9);
	}
	.avatar-wrap {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		overflow: hidden;
		background: #E8F7F2;
		flex-shrink: 0;
		border: 3rpx solid #B8E6D5;
	}
	.avatar {
		width: 96rpx;
		height: 96rpx;
	}
	.account-info {
		flex: 1;
		margin-left: 22rpx;
		overflow: hidden;
	}
	.account-name {
		font-size: 32rpx;
		font-weight: 700;
		color: #2F8A74;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.account-desc {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #7AA89A;
	}
	.login-chip {
		display: inline-block;
		padding: 14rpx 26rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #7DCEB8, #5DBA9D);
		color: #fff;
		font-size: 24rpx;
		font-weight: 600;
		box-shadow: 0 8rpx 16rpx rgba(93, 186, 157, 0.28);
	}
	.arrow {
		font-size: 44rpx;
		color: #b0bec0;
		line-height: 1;
		padding: 0 4rpx;
	}

	.hero-card {
		margin-top: 0;
		position: relative;
		overflow: hidden;
		background: linear-gradient(155deg, #8FD4C0 0%, #5DBA9D 55%, #4AAE95 100%);
		border-radius: 36rpx;
		padding: 64rpx 40rpx 56rpx;
		text-align: center;
		box-shadow: 0 20rpx 48rpx rgba(93, 186, 157, 0.28);
		color: #fff;
		flex-shrink: 0;
	}
	.hero-deco {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);
		pointer-events: none;
	}
	.hero-deco-1 {
		width: 220rpx;
		height: 220rpx;
		top: -80rpx;
		right: -60rpx;
	}
	.hero-deco-2 {
		width: 160rpx;
		height: 160rpx;
		bottom: -50rpx;
		left: -40rpx;
	}
	.mole-badge {
		width: 100rpx;
		height: 100rpx;
		margin: 0 auto 16rpx;
		border-radius: 28rpx;
		background: rgba(255, 255, 255, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 56rpx;
		line-height: 1;
		backdrop-filter: blur(4px);
	}
	.title {
		font-size: 48rpx;
		font-weight: 800;
		letter-spacing: 3rpx;
		position: relative;
	}
	.subtitle {
		margin-top: 14rpx;
		font-size: 26rpx;
		opacity: 0.92;
		letter-spacing: 1rpx;
		position: relative;
	}
	.start-btn {
		margin-top: 40rpx;
		width: 72%;
		height: 92rpx;
		line-height: 92rpx;
		background: #fff;
		color: #3D9A84;
		border-radius: 999rpx;
		font-size: 34rpx;
		font-weight: 700;
		box-shadow: 0 12rpx 28rpx rgba(74, 174, 149, 0.18);
		position: relative;
	}
	.start-btn::after {
		border: none;
	}
	.hero-hint {
		margin-top: 20rpx;
		font-size: 22rpx;
		opacity: 0.72;
		position: relative;
	}

	.feature-grid {
		margin-top: 0;
		display: flex;
		justify-content: space-between;
		gap: 16rpx;
		flex-shrink: 0;
	}
	.feature-card {
		flex: 1;
		min-width: 0;
		padding: 32rpx 12rpx 28rpx;
		border-radius: 24rpx;
		text-align: center;
		box-shadow: 0 10rpx 24rpx rgba(93, 186, 157, 0.08);
		border: 1rpx solid rgba(255, 255, 255, 0.85);
		position: relative;
		overflow: hidden;
	}
	.feature-card::after {
		content: '';
		position: absolute;
		right: -20rpx;
		bottom: -24rpx;
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.45);
		pointer-events: none;
	}
	.feature-card.word {
		background: linear-gradient(160deg, #EAF6FC 0%, #F4FBFE 100%);
	}
	.feature-card.record {
		background: linear-gradient(160deg, #FFF6E8 0%, #FFFBF3 100%);
	}
	.feature-card.badge {
		background: linear-gradient(160deg, #FCEEF2 0%, #FFF7F9 100%);
	}
	.feature-icon {
		width: 72rpx;
		height: 72rpx;
		margin: 0 auto 14rpx;
		border-radius: 22rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36rpx;
		background: rgba(255, 255, 255, 0.88);
		box-shadow: 0 6rpx 14rpx rgba(0, 0, 0, 0.04);
		position: relative;
		z-index: 1;
	}
	.feature-title {
		font-size: 28rpx;
		font-weight: 700;
		color: #2F8A74;
		position: relative;
		z-index: 1;
	}
	.feature-desc {
		margin-top: 6rpx;
		font-size: 20rpx;
		color: #8AAE9F;
		position: relative;
		z-index: 1;
	}

	.ad-wrap {
		margin-top: 28rpx;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.page-foot {
		position: relative;
		z-index: 1;
		margin-top: auto;
		padding-top: 24rpx;
		padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	}
</style>
