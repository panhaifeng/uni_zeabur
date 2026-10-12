<template>
	<view>
		<cu-custom bgColor="bg-blue" :isBack="false">
			<block slot="content">我的</block>
		</cu-custom>

		<view class="cu-list menu-avatar">
			<view class="cu-item">
				<view class="cu-avatar round lg bg-blue">
					<text class="cuIcon-people"></text>
				</view>
				<view class="content flex-sub">
					<view class="text-grey">{{ user.nickname || user.username || '未登录' }}</view>
					<view class="text-gray text-sm">账号：{{ user.username || '-' }}</view>
				</view>
			</view>
		</view>

		<view class="cu-list menu sm-border card-menu margin-top">
			<view class="cu-item arrow" @tap="goPage('/pages/user/list')">
				<view class="content">
					<text class="cuIcon-friendfill text-blue margin-right-xs"></text>
					<text class="text-grey">用户管理</text>
				</view>
			</view>
			<view class="cu-item arrow" @tap="goPage('/pages/config/index')">
				<view class="content">
					<text class="cuIcon-settingsfill text-blue margin-right-xs"></text>
					<text class="text-grey">系统配置</text>
				</view>
			</view>
			<view class="cu-item" @tap="logout">
				<view class="content">
					<text class="cuIcon-exit text-red margin-right-xs"></text>
					<text class="text-red">退出登录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { post } from '@/common/request.js'
	import { clearLogin, getUser, isLogin } from '@/common/auth.js'

	export default {
		data() {
			return {
				user: {}
			}
		},
		onShow() {
			if (!isLogin()) {
				uni.reLaunch({ url: '/pages/login/login' })
				return
			}
			this.user = getUser()
		},
		methods: {
			goPage(url) {
				uni.navigateTo({ url })
			},
			logout() {
				uni.showModal({
					title: '提示',
					content: '确定退出登录吗？',
					success: (res) => {
						if (!res.confirm) return
						post('/login/logout').finally(() => {
							clearLogin()
							uni.reLaunch({ url: '/pages/login/login' })
						})
					}
				})
			}
		}
	}
</script>
