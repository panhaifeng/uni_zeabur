<template>
	<view class="page">
		<view class="section-title">选择词库</view>
		<view class="lib-list">
			<view
				class="lib-item"
				:class="{ active: libId === item.id }"
				v-for="item in libs"
				:key="item.id"
				@tap="libId = item.id"
			>
				<view class="lib-name">{{ item.lib_name }}</view>
				<view class="lib-desc">{{ item.lib_desc }}</view>
			</view>
			<view class="empty" v-if="!loadingLibs && !libs.length">
				<view>词库加载失败或为空</view>
				<button class="retry" size="mini" @tap="initPage">重试</button>
			</view>
		</view>

		<view class="section-title">选择难度</view>
		<view class="diff-list">
			<view
				class="diff-item"
				:class="{ active: difficult === item.name }"
				v-for="item in diffs"
				:key="item.name"
				@tap="difficult = item.name"
			>
				<view class="diff-name">{{ item.name }}</view>
				<view class="diff-desc">{{ item.desc }}</view>
			</view>
		</view>

		<button class="start-btn" :loading="loading" @tap="startGame">开始游戏</button>
		<disclaimer />
	</view>
</template>

<script>
	import { get, post } from '@/common/request.js'
	import { ensureAnonymousId, setLogin } from '@/common/auth.js'
	import disclaimer from '@/components/disclaimer.vue'

	export default {
		components: { disclaimer },
		data() {
			return {
				libs: [],
				libId: 0,
				difficult: '普通',
				diffs: [
					{ name: '简单', desc: '3 洞口 · 停留 2.5 秒' },
					{ name: '普通', desc: '4 洞口 · 停留 1.8 秒' },
					{ name: '困难', desc: '5 洞口 · 停留 1.2 秒' }
				],
				loading: false,
				loadingLibs: false
			}
		},
		onLoad() {
			this.initPage()
		},
		methods: {
			initPage() {
				ensureAnonymousId()
				this.loadingLibs = true
				// 先拿游客 token，再拉词库，避免 401
				get('/user/get-info').then((res) => {
					if (res.code === 0 && res.data && res.data.user) {
						setLogin(res.data.user.token, res.data.user)
					}
					return get('/word/lib-list')
				}).then((res) => {
					this.loadingLibs = false
					if (!res) return
					if (res.code === 0) {
						this.libs = (res.data && res.data.list) || []
						if (this.libs.length) {
							this.libId = this.libs[0].id
						} else {
							uni.showToast({ icon: 'none', title: '词库为空，请先导入 word_mole.sql' })
						}
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '加载词库失败' })
					}
				}).catch((err) => {
					this.loadingLibs = false
					uni.showToast({ icon: 'none', title: (err && err.msg) || '加载失败，请重试' })
				})
			},
			startGame() {
				if (!this.libId) {
					uni.showToast({ icon: 'none', title: '请选择词库' })
					return
				}
				this.loading = true
				post('/game/start', {
					lib_id: this.libId,
					difficult: this.difficult
				}).then((res) => {
					this.loading = false
					if (res.code !== 0) {
						uni.showToast({ icon: 'none', title: res.msg || '开始失败' })
						return
					}
					uni.setStorageSync('mole_round', res.data || {})
					uni.redirectTo({ url: '/pages/game/game' })
				}).catch(() => {
					this.loading = false
				})
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #e8f5e9;
		padding: 30rpx;
		box-sizing: border-box;
	}
	.section-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #1b5e20;
		margin: 20rpx 0;
	}
	.lib-item, .diff-item {
		background: #fff;
		border-radius: 16rpx;
		padding: 28rpx;
		margin-bottom: 20rpx;
		border: 2rpx solid transparent;
	}
	.lib-item.active, .diff-item.active {
		border-color: #43a047;
		background: #f1f8e9;
	}
	.lib-name, .diff-name {
		font-size: 32rpx;
		color: #2e7d32;
		font-weight: 600;
	}
	.lib-desc, .diff-desc {
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #888;
	}
	.empty {
		text-align: center;
		color: #999;
		padding: 30rpx 0;
		font-size: 26rpx;
	}
	.retry {
		margin-top: 16rpx;
		background: #e8f5e9;
		color: #2e7d32;
	}
	.start-btn {
		margin-top: 40rpx;
		background: #43a047;
		color: #fff;
		border-radius: 48rpx;
	}
</style>
