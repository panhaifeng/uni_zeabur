<template>
	<view class="page">
		<view class="card">
			<view class="score">{{ result.score || 0 }} 分</view>
			<view class="line">答对 {{ result.right_count || 0 }} / {{ result.total_count || 10 }}</view>
			<view class="line">正确率 {{ rate }}%</view>
			<view class="comment">{{ comment }}</view>
		</view>

		<view class="section" v-if="errorList.length">
			<view class="section-title">错题</view>
			<view class="err-item" v-for="(item, idx) in errorList" :key="item.id" @tap="toggle(idx)">
				<view class="err-word">{{ item.word }}</view>
				<view class="err-detail" v-if="item.open">
					<view>{{ item.phonetic }}</view>
					<view>{{ item.meaning }}</view>
				</view>
			</view>
		</view>

		<button class="btn primary" @tap="again">再来一局</button>
		<button class="btn" @tap="goHome">返回首页</button>

		<disclaimer />
	</view>
</template>

<script>
	import { post } from '@/common/request.js'
	import config from '@/common/config.js'
	import disclaimer from '@/components/disclaimer.vue'

	export default {
		components: { disclaimer },
		data() {
			return {
				result: {},
				errorList: [],
				saved: false
			}
		},
		computed: {
			rate() {
				const t = this.result.total_count || 10
				const r = this.result.right_count || 0
				return Math.round((r / t) * 100)
			},
			comment() {
				const r = this.result.right_count || 0
				if (r <= 4) return '地鼠高手还需要多多练习！'
				if (r <= 7) return '很棒，继续加油！'
				return '单词捕手！太强啦！'
			}
		},
		onLoad() {
			this.result = uni.getStorageSync('mole_result') || {}
			const words = this.result.words || []
			const ids = this.result.error_word_ids || []
			this.errorList = words.filter((w) => ids.indexOf(w.id) >= 0).map((w) => {
				return Object.assign({}, w, { open: false })
			})
			this.saveRound()
			this.showInterstitial()
		},
		methods: {
			toggle(idx) {
				this.$set(this.errorList[idx], 'open', !this.errorList[idx].open)
			},
			saveRound() {
				if (this.saved) return
				this.saved = true
				post('/game/save-round', {
					lib_id: this.result.lib_id,
					difficult: this.result.difficult,
					score: this.result.score,
					right_count: this.result.right_count,
					total_count: this.result.total_count,
					error_word_ids: this.result.error_word_ids || []
				}, {}, true).then((res) => {
					if (res.code === 0 && res.data && res.data.new_badges && res.data.new_badges.length) {
						const names = res.data.new_badges.map((b) => b.badge_name).join('、')
						uni.showToast({ icon: 'none', title: '解锁徽章：' + names, duration: 2500 })
					}
				}).catch(() => {})
			},
			showInterstitial() {
				// #ifdef MP-WEIXIN
				try {
					const ad = uni.createInterstitialAd({
						adUnitId: config.adInterstitialUnitId
					})
					ad.onError(() => {})
					ad.show().catch(() => {})
				} catch (e) {}
				// #endif
			},
			again() {
				uni.redirectTo({ url: '/pages/select/select' })
			},
			goHome() {
				uni.switchTab({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #e8f5e9;
		padding: 40rpx 30rpx;
		box-sizing: border-box;
	}
	.card {
		background: #fff;
		border-radius: 20rpx;
		padding: 40rpx;
		text-align: center;
	}
	.score {
		font-size: 64rpx;
		font-weight: 700;
		color: #2e7d32;
	}
	.line {
		margin-top: 12rpx;
		color: #555;
		font-size: 28rpx;
	}
	.comment {
		margin-top: 24rpx;
		color: #43a047;
		font-size: 30rpx;
		font-weight: 600;
	}
	.section {
		margin-top: 30rpx;
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
	}
	.section-title {
		font-size: 28rpx;
		color: #1b5e20;
		font-weight: 600;
		margin-bottom: 16rpx;
	}
	.err-item {
		padding: 18rpx 0;
		border-bottom: 1px solid #eee;
	}
	.err-word {
		font-size: 30rpx;
		color: #333;
	}
	.err-detail {
		margin-top: 8rpx;
		color: #777;
		font-size: 24rpx;
	}
	.btn {
		margin-top: 24rpx;
		background: #fff;
		color: #2e7d32;
		border-radius: 48rpx;
	}
	.btn.primary {
		background: #43a047;
		color: #fff;
	}
</style>
