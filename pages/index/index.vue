<template>
	<view>
		<cu-custom bgColor="bg-blue" :isBack="false">
			<block slot="content">首页</block>
		</cu-custom>

		<view class="cu-card case">
			<view class="cu-item shadow">
				<view class="cu-list menu-avatar">
					<view class="cu-item">
						<view class="cu-avatar round lg bg-blue">
							<text class="cuIcon-people"></text>
						</view>
						<view class="content flex-sub">
							<view class="text-grey">欢迎，{{ user.nickname || user.username || '用户' }}</view>
							<view class="text-gray text-sm">接口：{{ baseUrl }}</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="cu-list menu sm-border card-menu margin-top">
			<view class="cu-item arrow" @tap="goPage('/pages/user/list')">
				<view class="content">
					<text class="cuIcon-friendfill text-blue"></text>
					<text class="text-grey">用户管理</text>
				</view>
			</view>
			<view class="cu-item arrow" @tap="goPage('/pages/config/index')">
				<view class="content">
					<text class="cuIcon-settingsfill text-blue"></text>
					<text class="text-grey">系统配置</text>
				</view>
			</view>
		</view>

		<view class="padding" v-if="notice">
			<view class="cu-bar bg-white solid-bottom">
				<view class="action">系统公告</view>
			</view>
			<view class="padding bg-white">{{ notice }}</view>
		</view>
	</view>
</template>

<script>
	import config from '@/common/config.js'
	import { get } from '@/common/request.js'
	import { getUser, isLogin } from '@/common/auth.js'

	export default {
		data() {
			return {
				baseUrl: config.baseUrl,
				user: {},
				notice: ''
			}
		},
		onShow() {
			if (!isLogin()) {
				uni.reLaunch({ url: '/pages/login/login' })
				return
			}
			this.user = getUser()
			this.loadHome()
		},
		methods: {
			loadHome() {
				get('/index/index').then((res) => {
					if (res.code === 1) {
						this.notice = (res.data && res.data.notice) || ''
						if (res.data && res.data.user) {
							this.user = res.data.user
						}
					}
				})
			},
			goPage(url) {
				uni.navigateTo({ url })
			}
		}
	}
</script>
