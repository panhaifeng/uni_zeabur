<template>
	<view class="page">
		<view class="profile">
			<view class="profile-row">
				<image class="p-avatar" :src="avatarSrc" mode="aspectFill"></image>
				<view class="p-meta">
					<view class="name">{{ user.nickname || '游客' }}</view>
					<view class="tag">{{ user.openid ? '微信账号 · 数据已同步' : '游客模式 · 可随时登录同步' }}</view>
				</view>
			</view>
			<button v-if="!user.openid" class="profile-login" @tap="wxLogin">微信一键登录</button>
			<button v-else class="profile-login ghost" @tap="openProfileEdit">设置头像昵称</button>
		</view>

		<!-- 头像昵称填写（个人小程序官方能力，需用户点选） -->
		<view class="mask" v-if="showProfile" @tap="showProfile = false">
			<view class="sheet" @tap.stop="">
				<view class="sheet-title">完善资料</view>
				<view class="sheet-tip">微信不再支持静默获取昵称，请点选填写</view>
				<!-- #ifdef MP-WEIXIN -->
				<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
					<image class="edit-avatar" :src="editAvatar || avatarSrc" mode="aspectFill"></image>
					<text class="avatar-tip">点击选择头像</text>
				</button>
				<input
					class="nick-input"
					type="nickname"
					:value="editNickname"
					placeholder="点击填写微信昵称"
					@blur="onNickBlur"
					@input="onNickInput"
				/>
				<!-- #endif -->
				<!-- #ifndef MP-WEIXIN -->
				<input class="nick-input" v-model="editNickname" placeholder="请输入昵称" />
				<!-- #endif -->
				<button class="save-btn" :loading="saving" @tap="saveProfile">保存</button>
			</view>
		</view>

		<view class="stats">
			<view class="stat"><text class="n">{{ stats.max_score || 0 }}</text><text class="l">最高分</text></view>
			<view class="stat"><text class="n">{{ stats.total_round || 0 }}</text><text class="l">总对局</text></view>
			<view class="stat"><text class="n">{{ stats.total_right || 0 }}</text><text class="l">总答对</text></view>
			<view class="stat"><text class="n">{{ stats.streak_days || 0 }}</text><text class="l">连续天数</text></view>
		</view>

		<view class="tabs">
			<view class="tab" :class="{ on: tab === 'word' }" @tap="tab = 'word'; loadWords()">生词本</view>
			<view class="tab" :class="{ on: tab === 'record' }" @tap="tab = 'record'; loadRecords()">战绩</view>
			<view class="tab" :class="{ on: tab === 'badge' }" @tap="tab = 'badge'; loadBadges()">徽章</view>
		</view>

		<!-- 生词本 -->
		<view v-if="tab === 'word'" class="panel">
			<view class="empty" v-if="!words.length">暂无生词</view>
			<view class="word-card" v-for="item in words" :key="item.error_id" @tap="flip(item)">
				<view v-if="!item.flipped" class="front">{{ item.word }}</view>
				<view v-else class="back">
					<view>{{ item.phonetic }}</view>
					<view>{{ item.meaning }}</view>
				</view>
				<button class="mini-btn" size="mini" @tap.stop="removeWord(item)">移出生词本</button>
			</view>
		</view>

		<!-- 战绩 -->
		<view v-if="tab === 'record'" class="panel">
			<view class="empty" v-if="!records.length">暂无对局记录</view>
			<view class="rec" v-for="item in records" :key="item.id">
				<view>{{ item.lib_name || ('词库' + item.lib_id) }} · {{ item.difficult }}</view>
				<view class="rec-sub">得分 {{ item.score }} · 答对 {{ item.right_count }}/{{ item.total_count }}</view>
				<view class="rec-sub">{{ item.create_time }}</view>
			</view>
		</view>

		<!-- 徽章 -->
		<view v-if="tab === 'badge'" class="panel">
			<view class="tip">徽章仅为趣味荣誉展示，无实物/现金奖励</view>
			<view class="empty" v-if="!badges.length">尚未解锁徽章，去玩一局吧</view>
			<view class="badge" v-for="item in badges" :key="item.id">
				<view class="b-name">{{ item.badge_name }}</view>
				<view class="b-key">{{ item.badge_key }} · {{ item.unlock_time }}</view>
			</view>
		</view>

		<view class="actions">
			<button v-if="user.openid" class="btn" @tap="logout">退出登录</button>
			<button class="btn danger" @tap="clearCache">清除本地缓存</button>
		</view>

		<disclaimer />
	</view>
</template>

<script>
	import { get, post } from '@/common/request.js'
	import config from '@/common/config.js'
	import {
		ensureAnonymousId,
		getUser,
		getToken,
		setLogin,
		clearLogin,
		clearAllCache
	} from '@/common/auth.js'
	import disclaimer from '@/components/disclaimer.vue'

	export default {
		components: { disclaimer },
		data() {
			return {
				tab: 'word',
				user: {},
				stats: {},
				words: [],
				records: [],
				badges: [],
				showProfile: false,
				editNickname: '',
				editAvatar: '',
				avatarLocal: '',
				saving: false
			}
		},
		computed: {
			avatarSrc() {
				const a = this.user.avatar || ''
				if (!a) return '/static/sample.jpg'
				if (a.indexOf('http') === 0 || a.indexOf('wxfile://') === 0 || a.indexOf('http://tmp') === 0) return a
				return config.baseUrl + a
			}
		},
		onLoad(query) {
			if (query && query.tab) {
				this.tab = query.tab
			}
		},
		onShow() {
			const savedTab = uni.getStorageSync('mole_mine_tab')
			if (savedTab) {
				this.tab = savedTab
				uni.removeStorageSync('mole_mine_tab')
			}
			ensureAnonymousId()
			this.loadInfo().then(() => {
				if (uni.getStorageSync('mole_open_profile')) {
					uni.removeStorageSync('mole_open_profile')
					if (this.user.openid) {
						this.openProfileEdit()
					}
				}
			})
			if (this.tab === 'word') this.loadWords()
			if (this.tab === 'record') this.loadRecords()
			if (this.tab === 'badge') this.loadBadges()
		},
		methods: {
			loadInfo() {
				return get('/user/get-info').then((res) => {
					if (res.code === 0 && res.data) {
						this.user = res.data.user || {}
						this.stats = res.data.stats || {}
						this.badges = res.data.badges || []
						if (this.user.token) {
							setLogin(this.user.token, this.user)
						}
					}
					return res
				}).catch(() => null)
			},
			loadWords() {
				get('/user/error-word').then((res) => {
					if (res.code === 0) {
						const list = (res.data && res.data.list) || []
						this.words = list.map((w) => Object.assign({}, w, { flipped: false }))
					}
				})
			},
			loadRecords() {
				get('/user/record-list', { page: 1, pageSize: 20 }).then((res) => {
					if (res.code === 0) {
						this.records = (res.data && res.data.list) || []
					}
				})
			},
			loadBadges() {
				get('/user/badge').then((res) => {
					if (res.code === 0) {
						this.badges = (res.data && res.data.list) || []
					}
				})
			},
			flip(item) {
				this.$set(item, 'flipped', !item.flipped)
			},
			removeWord(item) {
				uni.showModal({
					title: '提示',
					content: '确定移出该生词？',
					success: (r) => {
						if (!r.confirm) return
						post('/user/remove-word', { word_item_id: item.word_item_id }).then((res) => {
							if (res.code === 0) {
								this.loadWords()
							} else {
								uni.showToast({ icon: 'none', title: res.msg || '操作失败' })
							}
						})
					}
				})
			},
			wxLogin() {
				// #ifdef MP-WEIXIN
				uni.login({
					provider: 'weixin',
					success: (loginRes) => {
						if (!loginRes.code) return
						uni.showLoading({ title: '登录中', mask: true })
						post('/user/wx-login', { code: loginRes.code }).then((res) => {
							uni.hideLoading()
							if (res.code === 0 && res.data && res.data.user) {
								setLogin(res.data.user.token, res.data.user)
								this.user = res.data.user
								this.loadInfo()
								uni.showToast({ icon: 'none', title: '登录成功' })
								// 默认昵称则引导填写
								if (!res.data.user.nickname || res.data.user.nickname === '微信用户') {
									this.openProfileEdit()
								}
							} else {
								uni.showToast({ icon: 'none', title: res.msg || '登录失败' })
							}
						}).catch(() => uni.hideLoading())
					}
				})
				// #endif
				// #ifndef MP-WEIXIN
				uni.showToast({ icon: 'none', title: '请在微信小程序中使用' })
				// #endif
			},
			openProfileEdit() {
				this.editNickname = (this.user.nickname && this.user.nickname !== '微信用户') ? this.user.nickname : ''
				this.editAvatar = ''
				this.avatarLocal = ''
				this.showProfile = true
			},
			onChooseAvatar(e) {
				const url = e.detail && e.detail.avatarUrl
				if (!url) return
				this.avatarLocal = url
				this.editAvatar = url
			},
			onNickInput(e) {
				this.editNickname = (e.detail && e.detail.value) || ''
			},
			onNickBlur(e) {
				this.editNickname = (e.detail && e.detail.value) || this.editNickname
			},
			saveProfile() {
				const nick = (this.editNickname || '').trim()
				if (!nick) {
					uni.showToast({ icon: 'none', title: '请填写昵称' })
					return
				}
				this.saving = true
				const afterNick = () => {
					post('/user/update-profile', { nickname: nick }).then((res) => {
						this.saving = false
						if (res.code === 0 && res.data && res.data.user) {
							setLogin(res.data.user.token, res.data.user)
							this.user = res.data.user
							this.showProfile = false
							uni.showToast({ icon: 'none', title: '资料已保存' })
						} else {
							uni.showToast({ icon: 'none', title: (res && res.msg) || '保存失败' })
						}
					}).catch(() => {
						this.saving = false
					})
				}
				// 先上传头像（可选）
				if (this.avatarLocal) {
					uni.uploadFile({
						url: config.baseUrl + config.apiPrefix + '/user/upload-avatar',
						filePath: this.avatarLocal,
						name: 'file',
						header: {
							token: getToken()
						},
						formData: {
							token: getToken(),
							anonymous_id: ensureAnonymousId()
						},
						success: (up) => {
							try {
								const body = typeof up.data === 'string' ? JSON.parse(up.data) : up.data
								if (body.code === 0 && body.data && body.data.user) {
									setLogin(body.data.user.token, body.data.user)
									this.user = body.data.user
								}
							} catch (e) {}
							afterNick()
						},
						fail: () => {
							afterNick()
						}
					})
				} else {
					afterNick()
				}
			},
			logout() {
				clearLogin()
				ensureAnonymousId()
				this.user = getUser()
				this.loadInfo()
				uni.showToast({ icon: 'none', title: '已退出，切回游客' })
			},
			clearCache() {
				uni.showModal({
					title: '提示',
					content: '清除后游客身份会重置，历史数据可能无法找回',
					success: (r) => {
						if (!r.confirm) return
						clearAllCache()
						ensureAnonymousId()
						uni.reLaunch({ url: '/pages/index/index' })
					}
				})
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #e8f5e9;
		padding: 24rpx;
		box-sizing: border-box;
	}
	.profile {
		background: linear-gradient(135deg, #43a047, #2e7d32);
		color: #fff;
		border-radius: 20rpx;
		padding: 28rpx;
	}
	.profile-row {
		display: flex;
		align-items: center;
	}
	.p-avatar {
		width: 96rpx;
		height: 96rpx;
		border-radius: 50%;
		background: rgba(255,255,255,.25);
		flex-shrink: 0;
	}
	.p-meta {
		margin-left: 20rpx;
		flex: 1;
	}
	.name { font-size: 34rpx; font-weight: 700; }
	.tag { margin-top: 8rpx; font-size: 22rpx; opacity: .9; }
	.profile-login {
		margin-top: 24rpx;
		background: #fff;
		color: #07c160;
		border-radius: 999rpx;
		font-size: 28rpx;
		font-weight: 700;
		height: 76rpx;
		line-height: 76rpx;
	}
	.profile-login.ghost {
		background: rgba(255,255,255,.18);
		color: #fff;
		border: 1px solid rgba(255,255,255,.55);
	}
	.mask {
		position: fixed;
		left: 0; right: 0; top: 0; bottom: 0;
		background: rgba(0,0,0,.45);
		z-index: 100;
		display: flex;
		align-items: flex-end;
	}
	.sheet {
		width: 100%;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding: 36rpx 32rpx calc(36rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}
	.sheet-title {
		text-align: center;
		font-size: 32rpx;
		font-weight: 700;
		color: #1b5e20;
	}
	.sheet-tip {
		margin-top: 10rpx;
		text-align: center;
		font-size: 22rpx;
		color: #999;
	}
	.avatar-btn {
		margin-top: 28rpx;
		background: #f5f5f5;
		border-radius: 16rpx;
		padding: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.edit-avatar {
		width: 128rpx;
		height: 128rpx;
		border-radius: 50%;
		background: #e8f5e9;
	}
	.avatar-tip {
		margin-top: 12rpx;
		font-size: 24rpx;
		color: #666;
	}
	.nick-input {
		margin-top: 24rpx;
		background: #f5f5f5;
		border-radius: 12rpx;
		padding: 22rpx 24rpx;
		font-size: 28rpx;
	}
	.save-btn {
		margin-top: 28rpx;
		background: #07c160;
		color: #fff;
		border-radius: 999rpx;
		font-weight: 700;
	}
	.stats {
		margin-top: 20rpx;
		background: #fff;
		border-radius: 16rpx;
		display: flex;
		padding: 24rpx 0;
	}
	.stat {
		flex: 1;
		text-align: center;
	}
	.n { display: block; font-size: 32rpx; color: #2e7d32; font-weight: 700; }
	.l { font-size: 22rpx; color: #888; }
	.tabs {
		margin-top: 20rpx;
		display: flex;
		background: #fff;
		border-radius: 12rpx;
		overflow: hidden;
	}
	.tab {
		flex: 1;
		text-align: center;
		padding: 22rpx 0;
		color: #666;
		font-size: 28rpx;
	}
	.tab.on {
		color: #2e7d32;
		font-weight: 700;
		background: #f1f8e9;
	}
	.panel {
		margin-top: 20rpx;
		background: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		min-height: 200rpx;
	}
	.empty { text-align: center; color: #999; padding: 40rpx 0; }
	.word-card {
		border: 1px solid #e0e0e0;
		border-radius: 12rpx;
		padding: 24rpx;
		margin-bottom: 16rpx;
		position: relative;
	}
	.front { font-size: 36rpx; font-weight: 700; color: #333; }
	.back { color: #555; font-size: 28rpx; line-height: 1.6; }
	.mini-btn {
		margin-top: 12rpx;
		background: #eee;
		color: #666;
	}
	.rec {
		padding: 18rpx 0;
		border-bottom: 1px solid #f0f0f0;
		font-size: 28rpx;
		color: #333;
	}
	.rec-sub { font-size: 24rpx; color: #888; margin-top: 6rpx; }
	.tip { font-size: 22rpx; color: #999; margin-bottom: 16rpx; }
	.badge {
		padding: 18rpx 0;
		border-bottom: 1px solid #f0f0f0;
	}
	.b-name { font-size: 30rpx; color: #2e7d32; font-weight: 600; }
	.b-key { font-size: 22rpx; color: #999; margin-top: 6rpx; }
	.actions { margin-top: 30rpx; }
	.btn {
		margin-bottom: 16rpx;
		border-radius: 48rpx;
		background: #fff;
		color: #2e7d32;
	}
	.btn.wx { background: #07c160; color: #fff; }
	.btn.danger { color: #e53935; }
</style>
