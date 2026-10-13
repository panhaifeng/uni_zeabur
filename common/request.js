import config from '@/common/config.js'
import { ensureAnonymousId, getToken, setLogin, clearLogin } from '@/common/auth.js'

function request(options = {}) {
	const url = (options.url || '').indexOf('http') === 0
		? options.url
		: config.baseUrl + config.apiPrefix + options.url

	const useJson = !!options.json
	const header = Object.assign({
		'content-type': useJson ? 'application/json' : 'application/x-www-form-urlencoded'
	}, options.header || {})

	const token = getToken()
	const anonymousId = ensureAnonymousId()
	if (token) {
		header.token = token
	}
	// 同时发两种头：部分网关会丢掉带下划线的 header
	header['anonymous-id'] = anonymousId
	header.anonymous_id = anonymousId

	// 关键：参数里也带上（避免 header 被过滤导致 401）
	let data = options.data || {}
	if (typeof data !== 'object' || data === null || Array.isArray(data)) {
		data = {}
	} else {
		data = Object.assign({}, data)
	}
	data.anonymous_id = anonymousId
	if (token) {
		data.token = token
	}

	if (useJson) {
		data = JSON.stringify(data)
	}

	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method: options.method || 'GET',
			data,
			header,
			success: (res) => {
				const body = res.data || {}
				if (body.code === 401) {
					clearLogin()
					reject(body)
					return
				}
				if (body.code === 0 && body.data && body.data.user && body.data.user.token) {
					setLogin(body.data.user.token, body.data.user)
				}
				resolve(body)
			},
			fail: (err) => {
				uni.showToast({ icon: 'none', title: '网络请求失败' })
				reject(err)
			}
		})
	})
}

export function get(url, data = {}, header = {}) {
	return request({ url, method: 'GET', data, header })
}

export function post(url, data = {}, header = {}, json = false) {
	return request({ url, method: 'POST', data, header, json })
}

export default {
	request,
	get,
	post
}
