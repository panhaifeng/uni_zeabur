<template>
	<view class="disclaimer">{{ text }}</view>
</template>

<script>
	import config from '@/common/config.js'
	export default {
		name: 'disclaimer',
		data() {
			return {
				text: config.disclaimer
			}
		}
	}
</script>

<style scoped>
	.disclaimer {
		padding: 24rpx 30rpx 40rpx;
		font-size: 22rpx;
		color: #999;
		text-align: center;
		line-height: 1.5;
	}
</style>
