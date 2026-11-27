<template>
	<view class="page">
		<!-- 倒计时遮罩 -->
		<view class="countdown-mask" v-if="counting">
			<text class="countdown-num">{{ countText }}</text>
		</view>

		<view class="status" :class="{ shake: lifeShake }">
			<text>分数 {{ score }}</text>
			<text class="life-text" :class="{ hit: lifeShake }">生命 {{ '❤️'.repeat(Math.max(life, 0)) }}{{ life <= 0 ? '💔' : '' }}</text>
			<text>{{ displayNo }} / {{ total }}</text>
		</view>

		<view class="switches">
			<switch :checked="soundOn" @change="e => soundOn = e.detail.value" color="#5DBA9D" />
			<text class="sw-label">音效</text>
			<switch :checked="showWord" @change="e => showWord = e.detail.value" color="#5DBA9D" />
			<text class="sw-label">显示英文</text>
		</view>

		<view class="word-area">
			<view class="word-en" v-if="showWord && current">{{ current.word }}</view>
			<view class="word-tip" v-else>听发音，点中文选义</view>
			<view class="phonetic" v-if="showWord && current">{{ current.phonetic }}</view>
		</view>

		<!-- 对错即时反馈 -->
		<view class="judge-pop" v-if="judge.show" :class="judge.type">
			<text class="judge-icon">{{ judge.icon }}</text>
			<text class="judge-title">{{ judge.title }}</text>
			<text class="judge-sub" v-if="judge.sub">{{ judge.sub }}</text>
		</view>

		<view class="holes" :class="'holes-' + holeCount">
			<view class="hole" v-for="(hole, i) in holes" :key="i" @tap="tapHole(i)">
				<view class="mole" :class="{ up: hole.show, right: hole.result === 'right', wrong: hole.result === 'wrong', reveal: hole.result === 'reveal' }">
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
				roundEnded: false,
				judge: { show: false, type: '', icon: '', title: '', sub: '' },
				lifeShake: false,
				feedbackTimer: null
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
			this.clearFeedbackTimer()
			destroyAudio()
		},
		methods: {
			resetHoles() {
				const arr = []
				for (let i = 0; i < this.holeCount; i++) {
					arr.push({ text: '', show: false, correct: false, result: '' })
				}
				this.holes = arr
			},
			showJudge(type, title, sub) {
				const map = {
					right: { icon: '✓', type: 'right' },
					wrong: { icon: '✗', type: 'wrong' },
					timeout: { icon: '⏱', type: 'timeout' }
				}
				const conf = map[type] || map.wrong
				this.judge = {
					show: true,
					type: conf.type,
					icon: conf.icon,
					title: title || '',
					sub: sub || ''
				}
			},
			hideJudge() {
				this.judge = { show: false, type: '', icon: '', title: '', sub: '' }
			},
			clearFeedbackTimer() {
				if (this.feedbackTimer) {
					clearTimeout(this.feedbackTimer)
					this.feedbackTimer = null
				}
			},
			markHoleResult(index, result) {
				if (index < 0 || index >= this.holes.length) return
				const next = this.holes.slice()
				next[index] = Object.assign({}, next[index], { result, show: true })
				this.holes = next
			},
			revealCorrect() {
				const next = this.holes.map((h) => {
					if (h.correct) {
						return Object.assign({}, h, { result: 'reveal', show: true })
					}
					return h
				})
				this.holes = next
			},
			pulseLife() {
				this.lifeShake = true
				setTimeout(() => {
					this.lifeShake = false
				}, 450)
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
				this.hideJudge()
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
					correct: text === cur.meaning,
					result: ''
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
					this.markHoleResult(i, 'right')
					this.showJudge('right', '正确', '+10 分')
					this.clearFeedbackTimer()
					this.feedbackTimer = setTimeout(() => {
						this.hideMoles()
						this.hideJudge()
						this.goNext()
					}, 650)
				} else {
					this.onWrong(false, i)
				}
			},
			onWrong(isTimeout, tappedIndex) {
				// 已处理过则忽略（超时与点击互斥）
				if (this.answered) return
				this.answered = true
				this.clearTimer()
				this.life -= 1
				this.pulseLife()
				playSfx('wrong', this.soundOn)
				try {
					uni.vibrateShort({ type: 'medium' })
				} catch (e) {}
				if (this.current && this.errorWordIds.indexOf(this.current.id) < 0) {
					this.errorWordIds.push(this.current.id)
				}
				if (!isTimeout && typeof tappedIndex === 'number') {
					this.markHoleResult(tappedIndex, 'wrong')
				}
				this.revealCorrect()
				if (isTimeout) {
					this.showJudge('timeout', '超时', '正确答案已标出')
				} else {
					this.showJudge('wrong', '答错了', '正确答案已标出')
				}
				this.clearFeedbackTimer()
				this.feedbackTimer = setTimeout(() => {
					this.hideMoles()
					this.hideJudge()
					this.goNext()
				}, 900)
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
				this.holes = this.holes.map((h) => Object.assign({}, h, { show: false, result: '' }))
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
				this.clearFeedbackTimer()
				this.hideJudge()
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
		background: linear-gradient(180deg, #7DCEB8, #D8F3EA);
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
		color: #3D9A84;
		transition: background 0.2s;
	}
	.status.shake {
		animation: status-shake 0.45s ease;
		background: rgba(255, 236, 232, 0.96);
	}
	.life-text.hit {
		color: #e53935;
		font-weight: 700;
	}
	@keyframes status-shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-8rpx); }
		40% { transform: translateX(8rpx); }
		60% { transform: translateX(-6rpx); }
		80% { transform: translateX(6rpx); }
	}
	.switches {
		margin-top: 16rpx;
		display: flex;
		align-items: center;
	}
	.sw-label {
		font-size: 24rpx;
		color: #2F8A74;
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
		color: #2F8A74;
	}
	.word-tip {
		font-size: 32rpx;
		color: #3D9A84;
	}
	.phonetic {
		margin-top: 8rpx;
		color: #555;
		font-size: 26rpx;
	}
	.judge-pop {
		margin: 18rpx auto 0;
		width: 72%;
		padding: 18rpx 20rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12rpx;
		animation: judge-in 0.28s ease-out;
		box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.08);
	}
	.judge-pop.right {
		background: linear-gradient(135deg, #34C759, #2F9E55);
	}
	.judge-pop.wrong,
	.judge-pop.timeout {
		background: linear-gradient(135deg, #FF6B5A, #E53935);
	}
	.judge-icon {
		font-size: 34rpx;
		color: #fff;
		font-weight: 800;
		line-height: 1;
	}
	.judge-title {
		font-size: 32rpx;
		color: #fff;
		font-weight: 800;
	}
	.judge-sub {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.92);
		font-weight: 600;
	}
	@keyframes judge-in {
		0% { transform: scale(0.72); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
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
		transition: transform 0.25s ease-out, background 0.2s, box-shadow 0.2s;
		z-index: 2;
		padding: 0 10rpx;
	}
	.mole.up {
		transform: translateY(0);
	}
	.mole.right {
		background: #34C759;
		box-shadow: 0 0 0 6rpx rgba(52, 199, 89, 0.35);
	}
	.mole.wrong {
		background: #E53935;
		box-shadow: 0 0 0 6rpx rgba(229, 57, 53, 0.3);
		animation: mole-wrong-shake 0.35s ease;
	}
	.mole.reveal {
		background: #34C759;
		box-shadow: 0 0 0 6rpx rgba(52, 199, 89, 0.35);
	}
	@keyframes mole-wrong-shake {
		0%, 100% { transform: translateY(0) rotate(0); }
		25% { transform: translateY(0) rotate(-4deg); }
		75% { transform: translateY(0) rotate(4deg); }
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
