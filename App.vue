<script>
	import { ensureAnonymousId } from '@/common/auth.js'
	import { get } from '@/common/request.js'

	export default {
		onLaunch() {
			// 先固定游客 ID，再请求；避免与首页并发时各生成一个 anonymous_id
			ensureAnonymousId()
			get('/user/get-info').catch(() => {})
		},
		onShow() {},
		onHide() {}
	}
</script>

<style>
	page {
		background-color: #F0FAF6;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
	button::after {
		border: none;
	}
</style>
