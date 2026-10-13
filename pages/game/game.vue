<template>
	<view class="page">
		<!-- 倒计时遮罩 -->
		<view class="countdown-mask" v-if="counting">
			<text class="countdown-num">{{ countText }}</text>
		</view>

		<view class="status">
			<text>分数 {{ score }}</text>
			<text>生命 {{ '❤️'.repeat(Math.max(life, 0)) }}{{ life <= 0 ? '💔' : '' }}</text>
			<text>{{ displayNo }} / {{ total }}</text>
		</view>

		<view class="switches">
			<switch :checked="soundOn" @change="e => soundOn = e.detail.value" color="#43a047" />
			<text class="sw-label">音效</text>
			<switch :checked="showWord" @change="e => showWord = e.detail.value" color="#43a047" />
			<text class="sw-label">显示英文</text>
		</view>

		<view class="word-area">
			<view class="word-en" v-if="showWord && current">{{ current.word }}</view>
			<view class="word-tip" v-else>听发音，点中文选义</view>
			<view class="phonetic" v-if="showWord && current">{{ current.phonetic }}</view>
		</view>

		<view class="holes" :class="'holes-' + holeCount">
			<view class="hole" v-for="(hole, i) in holes" :key="i" @tap="tapHole(i)">
				<view class="mole" :class="{ up: hole.show }">
					<text class="mole-text">{{ hole.text }}</text>
				</view>
				<view class="hole-bottom"></view>
			</view>
		</view>

		<disclaimer />
	</view>
</template>

<script>
	import { playWord, playSfx, destroyAudio } from '@/common/audio.js'
	import disclaimer from '@/components/disclaimer.vue'

	export default {
		components: { disclaimer },
		data() {
			return {
				words: [],
				libId: 0,
				difficult: '普通',
				holeCount: 4,
				stayMs: 1800,
				index: 0,
				total: 10,
				score: 0,
				life: 3,
				rightCount: 0,
				errorWordIds: [],
				holes: [],
				current: null,
				counting: true,
				countText: '3',
				soundOn: true,
				showWord: true,
				answered: false,
				timer: null,
				roundEnded: false
			}
		},
		computed: {
			displayNo() {
				if (!this.total) return 0
				const n = this.index + 1
				return n > this.total ? this.total : n
			}
		},
		onLoad() {
			const round = uni.getStorageSync('mole_round') || {}
			this.words = round.words || []
			this.libId = round.lib_id || 0
			this.difficult = round.difficult || '普通'
			this.holeCount = round.hole_count || 4
			this.stayMs = round.stay_ms || 1800
			this.total = this.words.length || 10
			this.resetHoles()
			if (!this.words.length) {
				uni.showToast({ icon: 'none', title: '本局单词为空' })
				setTimeout(() => uni.redirectTo({ url: '/pages/select/select' }), 800)
				return
			}
			this.startCountdown()
		},
		onUnload() {
			this.clearTimer()
			destroyAudio()
		},
		methods: {
			resetHoles() {
				const arr = []
				for (let i = 0; i < this.holeCount; i++) {
					arr.push({ text: '', show: false, correct: false })
				}
				this.holes = arr
			},
			startCountdown() {
				let n = 3
				this.counting = true
				this.countText = String(n)
				const t = setInterval(() => {
					n--
					if (n > 0) {
						this.countText = String(n)
					} else if (n === 0) {
						this.countText = '开始'
					} else {
						clearInterval(t)
						this.counting = false
						this.nextQuestion()
					}
				}, 800)
			},
			nextQuestion() {
				if (this.roundEnded) return
				if (this.life <= 0 || this.index >= this.words.length) {
					this.finish()
					return
				}
				this.answered = false
				this.current = this.words[this.index]
				this.prepareHoles()
				if (this.soundOn) {
					playWord(this.current.word)
				}
				this.clearTimer()
				this.timer = setTimeout(() => {
					if (!this.answered) {
						this.onWrong(true)
					}
				}, this.stayMs)
			},
			prepareHoles() {
				const cur = this.current
				const options = [cur.meaning]
				const distract = (cur.distract || []).slice()
				while (options.length < this.holeCount && distract.length) {
					const i = Math.floor(Math.random() * distract.length)
					options.push(distract.splice(i, 1)[0])
				}
				while (options.length < this.holeCount) {
					options.push('——')
				}
				// 打乱
				for (let i = options.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1))
					const tmp = options[i]
					options[i] = options[j]
					options[j] = tmp
				}
				this.holes = options.map((text) => ({
					text,
					show: true,
					correct: text === cur.meaning
				}))
			},
			tapHole(i) {
				if (this.counting || this.answered || this.roundEnded) return
				const hole = this.holes[i]
				if (!hole || !hole.show) return
				this.clearTimer()
				if (hole.correct) {
					this.answered = true
					this.score += 10
					this.rightCount += 1
					playSfx('right', this.soundOn)
					this.hideMoles()
					setTimeout(() => {
						this.goNext()
					}, 400)
				} else {
					this.onWrong(false)
				}
			},
			onWrong(isTimeout) {
				// 已处理过则忽略（超时与点击互斥）
				if (this.answered) return
				this.answered = true
				this.clearTimer()
				this.life -= 1
				playSfx('wrong', this.soundOn)
				if (this.current && this.errorWordIds.indexOf(this.current.id) < 0) {
					this.errorWordIds.push(this.current.id)
				}
				this.hideMoles()
				setTimeout(() => {
					this.goNext()
				}, 500)
			},
			goNext() {
				if (this.roundEnded) return
				if (this.life <= 0 || this.index >= this.words.length - 1) {
					this.finish()
					return
				}
				this.index += 1
				this.nextQuestion()
			},
			hideMoles() {
				this.holes = this.holes.map((h) => Object.assign({}, h, { show: false }))
			},
			clearTimer() {
				if (this.timer) {
					clearTimeout(this.timer)
					this.timer = null
				}
			},
			finish() {
				if (this.roundEnded) return
				this.roundEnded = true
				this.clearTimer()
				const result = {
					lib_id: this.libId,
					difficult: this.difficult,
					score: this.score,
					right_count: this.rightCount,
					total_count: this.total,
					error_word_ids: this.errorWordIds,
					words: this.words
				}
				uni.setStorageSync('mole_result', result)
				uni.redirectTo({ url: '/pages/result/result' })
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(180deg, #66bb6a, #c8e6c9);
		padding: 20rpx 24rpx 0;
		box-sizing: border-box;
	}
	.countdown-mask {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background: rgba(0,0,0,.45);
		z-index: 99;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.countdown-num {
		font-size: 120rpx;
		color: #fff;
		font-weight: 700;
	}
	.status {
		display: flex;
		justify-content: space-between;
		background: rgba(255,255,255,.9);
		border-radius: 16rpx;
		padding: 18rpx 24rpx;
		font-size: 26rpx;
		color: #2e7d32;
	}
	.switches {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
	}
	.sw-label {
		font-size: 24rpx;
		color: #1b5e20;
		margin: 0 24rpx 0 8rpx;
	}
	.word-area {
		margin-top: 30rpx;
		text-align: center;
		min-height: 120rpx;
	}
	.word-en {
		font-size: 52rpx;
		font-weight: 700;
		color: #1b5e20;
	}
	.word-tip {
		font-size: 32rpx;
		color: #2e7d32;
	}
	.phonetic {
		margin-top: 8rpx;
		color: #555;
		font-size: 26rpx;
	}
	.holes {
		margin-top: 40rpx;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}
	.hole {
		width: 30%;
		height: 220rpx;
		margin: 2%;
		position: relative;
		overflow: hidden;
	}
	.holes-3 .hole { width: 30%; }
	.holes-4 .hole { width: 40%; }
	.holes-5 .hole { width: 30%; }
	.mole {
		position: absolute;
		left: 10%;
		right: 10%;
		bottom: 30rpx;
		height: 140rpx;
		background: #8d6e63;
		border-radius: 70rpx 70rpx 20rpx 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translateY(160rpx);
		transition: transform 0.25s ease-out;
		z-index: 2;
		padding: 0 10rpx;
	}
	.mole.up {
		transform: translateY(0);
	}
	.mole-text {
		color: #fff;
		font-size: 28rpx;
		text-align: center;
		font-weight: 600;
	}
	.hole-bottom {
		position: absolute;
		left: 5%;
		right: 5%;
		bottom: 0;
		height: 36rpx;
		background: #5d4037;
		border-radius: 50%;
		z-index: 3;
	}
</style>
