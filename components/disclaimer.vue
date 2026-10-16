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
		padding: 8rpx 24rpx 8rpx;
		font-size: 22rpx;
		color: #9AB8AE;
		text-align: center;
		line-height: 1.55;
	}
</style>
