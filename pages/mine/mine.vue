<template>
	<view class="page">
		<!-- 自定义顶部导航 -->
		<view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
				<view class="nav-brand">
					<text class="nav-title">我的</text>
				</view>
			</view>
		</view>

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
			<view class="empty" v-if="!words.length">
				<view class="empty-icon">📘</view>
				<view>暂无生词，去挑战积累错词吧</view>
			</view>
			<view class="list-hint" v-if="words.length">点击单词可翻转查看释义</view>
			<view class="word-card" v-for="item in words" :key="item.error_id" @tap="flip(item)">
				<view class="word-main">
					<view v-if="!item.flipped" class="word-front">
						<text class="word-en">{{ item.word }}</text>
						<text class="word-hint">点按翻转</text>
					</view>
					<view v-else class="word-back">
						<text class="word-phonetic" v-if="item.phonetic">{{ item.phonetic }}</text>
						<text class="word-meaning">{{ item.meaning }}</text>
					</view>
				</view>
				<view class="word-remove" @tap.stop="removeWord(item)">移出</view>
			</view>
		</view>

		<!-- 战绩 -->
		<view v-if="tab === 'record'" class="panel">
			<view class="empty" v-if="!records.length">
				<view class="empty-icon">🏆</view>
				<view>暂无对局记录</view>
			</view>
			<view class="rec-card" v-for="item in records" :key="item.id">
				<view class="rec-left">
					<view class="rec-title">{{ item.lib_name || ('词库' + item.lib_id) }}</view>
					<view class="rec-meta">
						<text class="rec-tag">{{ item.difficult }}</text>
						<text class="rec-sub">答对 {{ item.right_count }}/{{ item.total_count }}</text>
					</view>
					<view class="rec-time">{{ item.create_time }}</view>
				</view>
				<view class="rec-score">
					<text class="rec-score-n">{{ item.score }}</text>
					<text class="rec-score-l">分</text>
				</view>
			</view>
		</view>

		<!-- 徽章 -->
		<view v-if="tab === 'badge'" class="panel">
			<view class="tip">徽章仅为趣味荣誉展示，无实物/现金奖励</view>
			<view class="empty" v-if="!badges.length">
				<view class="empty-icon">🎖️</view>
				<view>尚未解锁徽章，去玩一局吧</view>
			</view>
			<view class="badge-card" v-for="item in badges" :key="item.id">
				<view class="badge-icon">🏅</view>
				<view class="badge-body">
					<view class="b-name">{{ item.badge_name }}</view>
					<view class="b-key">{{ item.unlock_time }}</view>
				</view>
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
				saving: false,
				statusBarHeight: 20,
				navBarHeight: 44
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
			this.initNav()
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
		background:
			radial-gradient(ellipse 80% 40% at 0% 0%, rgba(125, 206, 184, 0.28), transparent 55%),
			linear-gradient(180deg, #E8F7F2 0%, #F0FAF6 100%);
		padding: 0 24rpx calc(24rpx + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}
	.nav-wrap {
		margin: 0 -24rpx 12rpx;
		padding-left: 24rpx;
		padding-right: 24rpx;
		background: linear-gradient(180deg, rgba(93, 186, 157, 0.16) 0%, rgba(232, 247, 242, 0) 100%);
	}
	.nav-bar {
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}
	.nav-brand {
		display: flex;
		align-items: center;
	}
	.nav-title {
		font-size: 36rpx;
		font-weight: 800;
		color: #2F8A74;
		letter-spacing: 4rpx;
		line-height: 1.2;
	}
	.profile {
		background: linear-gradient(145deg, #8FD4C0 0%, #5DBA9D 55%, #4AAE95 100%);
		color: #fff;
		border-radius: 28rpx;
		padding: 32rpx;
		box-shadow: 0 16rpx 36rpx rgba(93, 186, 157, 0.28);
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
		color: #5DBA9D;
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
		color: #2F8A74;
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
		background: #E8F7F2;
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
		background: #5DBA9D;
		color: #fff;
		border-radius: 999rpx;
		font-weight: 700;
	}
	.stats {
		margin-top: 24rpx;
		background: rgba(255,255,255,.96);
		border-radius: 24rpx;
		display: flex;
		padding: 28rpx 0;
		box-shadow: 0 8rpx 24rpx rgba(93, 186, 157, 0.08);
	}
	.stat {
		flex: 1;
		text-align: center;
	}
	.n { display: block; font-size: 32rpx; color: #3D9A84; font-weight: 700; }
	.l { font-size: 22rpx; color: #888; }
	.tabs {
		margin-top: 24rpx;
		display: flex;
		background: rgba(255,255,255,.96);
		border-radius: 20rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(93, 186, 157, 0.08);
	}
	.tab {
		flex: 1;
		text-align: center;
		padding: 24rpx 0;
		color: #7AA89A;
		font-size: 28rpx;
	}
	.tab.on {
		color: #3D9A84;
		font-weight: 700;
		background: #E8F7F2;
	}
	.panel {
		margin-top: 20rpx;
		background: rgba(255,255,255,.96);
		border-radius: 24rpx;
		padding: 20rpx;
		min-height: 200rpx;
		box-shadow: 0 8rpx 24rpx rgba(93, 186, 157, 0.08);
	}
	.list-hint {
		font-size: 22rpx;
		color: #9AB8AE;
		padding: 4rpx 8rpx 16rpx;
	}
	.empty {
		text-align: center;
		color: #9AB8AE;
		padding: 56rpx 0 48rpx;
		font-size: 26rpx;
	}
	.empty-icon {
		font-size: 48rpx;
		margin-bottom: 12rpx;
		line-height: 1.2;
	}

	.word-card {
		display: flex;
		align-items: center;
		background: #F7FCFA;
		border: 1rpx solid #DCEEE7;
		border-radius: 20rpx;
		padding: 24rpx 20rpx 24rpx 28rpx;
		margin-bottom: 16rpx;
	}
	.word-card:last-child { margin-bottom: 0; }
	.word-main {
		flex: 1;
		min-width: 0;
		padding-right: 16rpx;
	}
	.word-front {
		display: flex;
		flex-direction: column;
	}
	.word-en {
		font-size: 36rpx;
		font-weight: 700;
		color: #2A4A42;
		letter-spacing: 1rpx;
	}
	.word-hint {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #9AB8AE;
	}
	.word-back {
		display: flex;
		flex-direction: column;
	}
	.word-phonetic {
		font-size: 24rpx;
		color: #7AA89A;
		margin-bottom: 6rpx;
	}
	.word-meaning {
		font-size: 28rpx;
		color: #3D5C54;
		line-height: 1.45;
	}
	.word-remove {
		flex-shrink: 0;
		padding: 12rpx 26rpx;
		border-radius: 999rpx;
		background: #fff;
		border: 1rpx solid #E8C4BF;
		color: #C97B73;
		font-size: 24rpx;
		font-weight: 600;
		letter-spacing: 2rpx;
		line-height: 1.2;
		box-shadow: 0 4rpx 12rpx rgba(201, 123, 115, 0.1);
	}

	.rec-card {
		display: flex;
		align-items: center;
		background: #F7FCFA;
		border: 1rpx solid #DCEEE7;
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		margin-bottom: 16rpx;
	}
	.rec-card:last-child { margin-bottom: 0; }
	.rec-left { flex: 1; min-width: 0; }
	.rec-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #2A4A42;
	}
	.rec-meta {
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}
	.rec-tag {
		display: inline-block;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
		background: #E8F7F2;
		color: #3D9A84;
		font-size: 20rpx;
		font-weight: 600;
		margin-right: 12rpx;
	}
	.rec-sub {
		font-size: 22rpx;
		color: #7AA89A;
	}
	.rec-time {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #9AB8AE;
	}
	.rec-score {
		flex-shrink: 0;
		margin-left: 16rpx;
		width: 100rpx;
		height: 100rpx;
		border-radius: 24rpx;
		background: linear-gradient(145deg, #8FD4C0, #5DBA9D);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #fff;
		box-shadow: 0 8rpx 18rpx rgba(93, 186, 157, 0.28);
	}
	.rec-score-n {
		font-size: 34rpx;
		font-weight: 800;
		line-height: 1;
	}
	.rec-score-l {
		margin-top: 4rpx;
		font-size: 20rpx;
		opacity: 0.9;
	}

	.tip {
		font-size: 22rpx;
		color: #9AB8AE;
		margin-bottom: 16rpx;
		padding: 0 4rpx;
	}
	.badge-card {
		display: flex;
		align-items: center;
		background: #F7FCFA;
		border: 1rpx solid #DCEEE7;
		border-radius: 20rpx;
		padding: 22rpx 24rpx;
		margin-bottom: 16rpx;
	}
	.badge-card:last-child { margin-bottom: 0; }
	.badge-icon {
		width: 72rpx;
		height: 72rpx;
		border-radius: 20rpx;
		background: #FFF6E5;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 34rpx;
		flex-shrink: 0;
	}
	.badge-body {
		margin-left: 20rpx;
		flex: 1;
		min-width: 0;
	}
	.b-name { font-size: 30rpx; color: #3D9A84; font-weight: 700; }
	.b-key { font-size: 22rpx; color: #9AB8AE; margin-top: 6rpx; }
	.actions { margin-top: 30rpx; }
	.btn {
		margin-bottom: 16rpx;
		border-radius: 48rpx;
		background: #fff;
		color: #3D9A84;
	}
	.btn.wx { background: #5DBA9D; color: #fff; }
	.btn.danger { color: #e53935; }
</style>
