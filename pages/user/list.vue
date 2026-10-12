<template>
	<view>
		<cu-custom bgColor="bg-blue" :isBack="true">
			<block slot="backText">返回</block>
			<block slot="content">用户管理</block>
		</cu-custom>

		<view class="cu-bar bg-white search">
			<view class="search-form round">
				<text class="cuIcon-search"></text>
				<input type="text" placeholder="用户名/昵称" v-model="keyword" confirm-type="search" @confirm="loadData" />
			</view>
			<view class="action">
				<button class="cu-btn bg-blue shadow-blur round" @tap="loadData">搜索</button>
			</view>
		</view>

		<view class="cu-list menu sm-border margin-top">
			<view class="cu-item" v-for="item in list" :key="item.id">
				<view class="content padding-tb-sm">
					<view>
						<text class="text-cut">{{ item.username }}</text>
						<text class="cu-tag sm radius margin-left-sm" :class="item.status == 1 ? 'bg-green' : 'bg-grey'">
							{{ item.status == 1 ? '正常' : '禁用' }}
						</text>
					</view>
					<view class="text-gray text-sm">昵称：{{ item.nickname || '-' }}</view>
					<view class="text-gray text-sm">创建：{{ item.create_time || '-' }}</view>
				</view>
			</view>
		</view>

		<view class="padding text-center text-gray" v-if="!list.length">暂无用户数据</view>
	</view>
</template>

<script>
	import { get } from '@/common/request.js'
	import { isLogin } from '@/common/auth.js'

	export default {
		data() {
			return {
				keyword: '',
				list: []
			}
		},
		onShow() {
			if (!isLogin()) {
				uni.reLaunch({ url: '/pages/login/login' })
				return
			}
			this.loadData()
		},
		methods: {
			loadData() {
				uni.showLoading({ title: '加载中', mask: true })
				get('/user/index', { keyword: this.keyword }).then((res) => {
					uni.hideLoading()
					if (res.code === 1) {
						this.list = (res.data && res.data.list) || []
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '加载失败' })
					}
				}).catch(() => {
					uni.hideLoading()
				})
			}
		}
	}
</script>
