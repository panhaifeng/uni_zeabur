<script>
	import { ensureAnonymousId } from '@/common/auth.js'
	import { get } from '@/common/request.js'

	export default {
		onLaunch() {
			ensureAnonymousId()
			// 静默初始化游客，拿到 token
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
