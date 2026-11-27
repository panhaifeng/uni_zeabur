<template>
	<view class="page">
		<view class="hint-card">
			<view class="hint-icon">💡</view>
			<view class="hint-text">你的想法很重要，功能建议、体验吐槽、词库需求都可以告诉我们。</view>
		</view>

		<view class="notice-card">
			<view class="notice-title">信息收集说明</view>
			<view class="notice-p">提交建议时，我们仅收集你填写的建议内容，用于产品改进；不收集手机号、微信号等联系方式或身份信息。详情见《用户服务协议》与《隐私政策》。</view>
		</view>

		<view class="form-card">
			<view class="label">建议内容 <text class="req">*</text></view>
			<textarea
				class="textarea"
				v-model="content"
				maxlength="1000"
				placeholder="请尽量具体描述，例如希望增加某个词库、某关太难/太简单等"
				:auto-height="false"
			/>
			<view class="count">{{ content.length }}/1000</view>
		</view>

		<view class="agree-row" @tap="agreed = !agreed">
			<view class="check" :class="{ on: agreed }">{{ agreed ? '✓' : '' }}</view>
			<view class="agree-text">
				我已阅读并同意
				<text class="link" @tap.stop="goAgreement">《用户服务协议》</text>
				与
				<text class="link" @tap.stop="goPrivacy">《隐私政策》</text>
			</view>
		</view>

		<button class="submit-btn" :loading="submitting" :disabled="submitting" @tap="submit">提交建议</button>
		<disclaimer />
	</view>
</template>

<script>
	import { post } from '@/common/request.js'
	import { ensureAnonymousId } from '@/common/auth.js'
	import disclaimer from '@/components/disclaimer.vue'

	export default {
		components: { disclaimer },
		data() {
			return {
				content: '',
				agreed: false,
				submitting: false
			}
		},
		onLoad() {
			ensureAnonymousId()
		},
		methods: {
			goAgreement() {
				uni.navigateTo({ url: '/pages/legal/agreement' })
			},
			goPrivacy() {
				uni.navigateTo({ url: '/pages/legal/privacy' })
			},
			submit() {
				const content = (this.content || '').trim()
				if (!content) {
					uni.showToast({ icon: 'none', title: '请填写建议内容' })
					return
				}
				if (!this.agreed) {
					uni.showToast({ icon: 'none', title: '请先阅读并同意协议' })
					return
				}
				if (this.submitting) return
				this.submitting = true
				uni.showLoading({ title: '提交中', mask: true })
				post('/suggestion/submit', { content }).then((res) => {
					uni.hideLoading()
					this.submitting = false
					if (res.code === 0) {
						uni.showToast({ icon: 'success', title: '提交成功' })
						setTimeout(() => {
							uni.navigateBack({ fail: () => {
								uni.switchTab({ url: '/pages/index/index' })
							}})
						}, 800)
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '提交失败' })
					}
				}).catch((err) => {
					uni.hideLoading()
					this.submitting = false
					uni.showToast({ icon: 'none', title: (err && err.msg) || '提交失败' })
				})
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		padding: 28rpx 28rpx 60rpx;
		box-sizing: border-box;
		background: linear-gradient(180deg, #E8F7F2 0%, #F0FAF6 40%, #F7FBF9 100%);
	}

	.hint-card {
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		padding: 24rpx 22rpx;
		border-radius: 24rpx;
		background: linear-gradient(135deg, #EAF8F3 0%, #F7FFFC 100%);
		border: 1rpx solid rgba(93, 186, 157, 0.22);
		box-shadow: 0 8rpx 20rpx rgba(93, 186, 157, 0.08);
	}
	.hint-icon {
		font-size: 36rpx;
		line-height: 1.2;
	}
	.hint-text {
		flex: 1;
		font-size: 26rpx;
		line-height: 1.55;
		color: #2F8A74;
	}

	.notice-card {
		margin-top: 20rpx;
		padding: 22rpx 22rpx;
		border-radius: 20rpx;
		background: #FFF9EE;
		border: 1rpx solid rgba(230, 180, 80, 0.28);
	}
	.notice-title {
		font-size: 26rpx;
		font-weight: 700;
		color: #9A6B1F;
		margin-bottom: 8rpx;
	}
	.notice-p {
		font-size: 24rpx;
		line-height: 1.55;
		color: #8A6A3A;
	}

	.form-card {
		margin-top: 24rpx;
		padding: 28rpx 24rpx 20rpx;
		border-radius: 28rpx;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 12rpx 28rpx rgba(93, 186, 157, 0.1);
	}
	.label {
		font-size: 28rpx;
		font-weight: 700;
		color: #2A4A42;
		margin-bottom: 14rpx;
	}
	.req {
		color: #e53935;
		font-weight: 700;
	}
	.textarea {
		width: 100%;
		min-height: 280rpx;
		padding: 20rpx;
		box-sizing: border-box;
		border-radius: 18rpx;
		background: #F4FAF7;
		color: #2A4A42;
		font-size: 28rpx;
		line-height: 1.5;
	}
	.count {
		margin-top: 10rpx;
		text-align: right;
		font-size: 22rpx;
		color: #9AB8AE;
	}

	.agree-row {
		margin-top: 28rpx;
		display: flex;
		align-items: flex-start;
		gap: 14rpx;
		padding: 0 8rpx;
	}
	.check {
		width: 36rpx;
		height: 36rpx;
		margin-top: 4rpx;
		border-radius: 8rpx;
		border: 2rpx solid #5DBA9D;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		color: #fff;
		flex-shrink: 0;
		background: #fff;
	}
	.check.on {
		background: #5DBA9D;
	}
	.agree-text {
		flex: 1;
		font-size: 24rpx;
		line-height: 1.6;
		color: #5A7A70;
	}
	.link {
		color: #2F8A74;
		font-weight: 600;
	}

	.submit-btn {
		margin-top: 28rpx;
		height: 92rpx;
		line-height: 92rpx;
		border-radius: 999rpx;
		background: linear-gradient(135deg, #5DBA9D 0%, #4AAE95 100%);
		color: #fff;
		font-size: 32rpx;
		font-weight: 700;
		box-shadow: 0 12rpx 28rpx rgba(74, 174, 149, 0.28);
	}
	.submit-btn::after {
		border: none;
	}
	.submit-btn[disabled] {
		opacity: 0.7;
	}
</style>
