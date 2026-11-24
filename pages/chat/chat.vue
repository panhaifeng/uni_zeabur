<template>
	<view class="page">
		<scroll-view
			class="msg-list"
			scroll-y
			:scroll-into-view="scrollInto"
			scroll-with-animation
		>
			<view v-if="!messages.length" class="empty-tip">跟我聊聊吧，有什么想问的～</view>
			<view
				v-for="(item, index) in messages"
				:id="'msg-' + index"
				:key="index"
				class="msg-row"
				:class="item.role"
			>
				<view class="bubble">{{ item.content }}</view>
			</view>
			<view id="msg-bottom" style="height: 1px;"></view>
		</scroll-view>

		<view class="input-bar">
			<input
				class="input"
				type="text"
				v-model="inputText"
				:disabled="sending"
				confirm-type="send"
				placeholder="输入消息..."
				@confirm="onSend"
			/>
			<button class="send-btn" :disabled="sending || !inputText.trim()" :loading="sending" @tap="onSend">
				{{ sending ? '发送中' : '发送' }}
			</button>
		</view>
	</view>
</template>

<script>
	import config from '@/common/config.js'
	import { getUser } from '@/common/auth.js'

	export default {
		data() {
			return {
				messages: [],
				inputText: '',
				sending: false,
				scrollInto: '',
				streamBuffer: '' // 粘包缓冲，解析 SSE
			}
		},
		methods: {
			scrollBottom() {
				this.$nextTick(() => {
					this.scrollInto = ''
					this.$nextTick(() => {
						this.scrollInto = 'msg-bottom'
					})
				})
			},
			onSend() {
				const text = (this.inputText || '').trim()
				if (!text || this.sending) return
				this.inputText = ''
				this.messages.push({ role: 'user', content: text })
				this.messages.push({ role: 'assistant', content: '' })
				this.scrollBottom()
				this.sending = true
				this.streamBuffer = ''
				this.startStream(text)
			},
			/**
			 * 微信小程序流式请求（基础库 >= 2.20.1，推荐 >= 2.21.0）
			 * 使用 enableChunked + onChunkReceived 接收 SSE 分片
			 */
			startStream(text) {
				const user = getUser() || {}
				const openid = user.openid || ''
				const url = config.baseUrl + '/index/ai/streamChat'
				const aiIndex = this.messages.length - 1

				const task = uni.request({
					url,
					method: 'POST',
					enableChunked: true,
					// 部分基础库用 responseType 配合分片；arraybuffer 再转 utf-8
					responseType: 'arraybuffer',
					header: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Accept: 'text/event-stream'
					},
					data: {
						message: text,
						openid
					},
					success: () => {
						// 流式场景主要内容在 onChunkReceived；此处作兜底结束
						this.finishSending()
					},
					fail: () => {
						this.patchAi(aiIndex, '网络异常，请稍后重试')
						this.finishSending()
					}
				})

				if (task && typeof task.onChunkReceived === 'function') {
					task.onChunkReceived((res) => {
						const chunk = this.decodeChunk(res.data)
						if (!chunk) return
						this.consumeSse(chunk, aiIndex)
					})
				} else {
					// 不支持分片时降级为普通接口
					this.fallbackOnce(text, aiIndex)
				}
			},
			decodeChunk(data) {
				if (!data) return ''
				if (typeof data === 'string') return data
				try {
					// #ifdef MP-WEIXIN
					const arr = data instanceof ArrayBuffer ? new Uint8Array(data) : data
					if (typeof TextDecoder !== 'undefined') {
						return new TextDecoder('utf-8').decode(arr)
					}
					// 兼容无 TextDecoder 的环境
					let str = ''
					for (let i = 0; i < arr.length; i++) {
						str += String.fromCharCode(arr[i])
					}
					try {
						return decodeURIComponent(escape(str))
					} catch (e) {
						return str
					}
					// #endif
				} catch (e) {
					return ''
				}
				return ''
			},
			consumeSse(chunk, aiIndex) {
				this.streamBuffer += chunk
				const parts = this.streamBuffer.split('\n')
				// 最后一段可能不完整，留在缓冲
				this.streamBuffer = parts.pop() || ''
				parts.forEach((line) => {
					const trimmed = line.trim()
					if (!trimmed || trimmed.indexOf('data:') !== 0) return
					const payload = trimmed.slice(5).trim()
					if (!payload || payload === '[DONE]') return
					let json
					try {
						json = JSON.parse(payload)
					} catch (e) {
						return
					}
					this.handleEvent(json, aiIndex)
				})
			},
			handleEvent(json, aiIndex) {
				if (!json) return
				const code = json.code
				if (code === 0) {
					if (json.delta) {
						const cur = this.messages[aiIndex] || { role: 'assistant', content: '' }
						cur.content = (cur.content || '') + json.delta
						this.$set(this.messages, aiIndex, cur)
						this.scrollBottom()
					}
					if (json.done) {
						this.finishSending()
					}
					return
				}
				// 业务错误
				if (json.retract) {
					this.$set(this.messages, aiIndex, {
						role: 'assistant',
						content: json.msg || '内容不合规，已拦截'
					})
				} else {
					const tip = json.msg || '请求失败'
					const cur = this.messages[aiIndex]
					if (cur && !cur.content) {
						this.$set(this.messages, aiIndex, { role: 'assistant', content: tip })
					} else {
						uni.showToast({ icon: 'none', title: tip })
					}
				}
				this.finishSending()
			},
			fallbackOnce(text, aiIndex) {
				const user = getUser() || {}
				uni.request({
					url: config.baseUrl + '/index/ai/chat',
					method: 'POST',
					header: { 'Content-Type': 'application/x-www-form-urlencoded' },
					data: { message: text, openid: user.openid || '' },
					success: (res) => {
						const body = res.data || {}
						if (body.code === 0 && body.data && body.data.content) {
							this.$set(this.messages, aiIndex, {
								role: 'assistant',
								content: body.data.content
							})
						} else {
							this.$set(this.messages, aiIndex, {
								role: 'assistant',
								content: body.msg || '请求失败'
							})
						}
						this.scrollBottom()
						this.finishSending()
					},
					fail: () => {
						this.patchAi(aiIndex, '网络异常，请稍后重试')
						this.finishSending()
					}
				})
			},
			patchAi(aiIndex, text) {
				this.$set(this.messages, aiIndex, { role: 'assistant', content: text })
				this.scrollBottom()
			},
			finishSending() {
				this.sending = false
				this.scrollBottom()
			}
		}
	}
</script>

<style scoped>
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f0faf6;
		box-sizing: border-box;
	}
	.msg-list {
		flex: 1;
		height: 0;
		padding: 24rpx 24rpx 12rpx;
		box-sizing: border-box;
	}
	.empty-tip {
		text-align: center;
		color: #9ab8ae;
		font-size: 26rpx;
		padding: 80rpx 0;
	}
	.msg-row {
		display: flex;
		margin-bottom: 20rpx;
	}
	.msg-row.user {
		justify-content: flex-end;
	}
	.msg-row.assistant {
		justify-content: flex-start;
	}
	.bubble {
		max-width: 75%;
		padding: 20rpx 24rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		line-height: 1.55;
		word-break: break-word;
		white-space: pre-wrap;
	}
	.msg-row.user .bubble {
		background: #07c160;
		color: #fff;
		border-top-right-radius: 6rpx;
	}
	.msg-row.assistant .bubble {
		background: #fff;
		color: #333;
		border-top-left-radius: 6rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
	}
	.input-bar {
		display: flex;
		align-items: center;
		padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
		background: #fff;
		border-top: 1rpx solid #e8f0ec;
		gap: 16rpx;
	}
	.input {
		flex: 1;
		height: 72rpx;
		padding: 0 24rpx;
		background: #f3f7f5;
		border-radius: 36rpx;
		font-size: 28rpx;
	}
	.send-btn {
		margin: 0;
		min-width: 140rpx;
		height: 72rpx;
		line-height: 72rpx;
		padding: 0 28rpx;
		background: #5dba9d;
		color: #fff;
		font-size: 28rpx;
		font-weight: 600;
		border-radius: 36rpx;
	}
	.send-btn[disabled] {
		opacity: 0.55;
	}
	.send-btn::after {
		border: none;
	}
</style>
