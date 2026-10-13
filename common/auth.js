import config from '@/common/config.js'

export function ensureAnonymousId() {
	let aid = uni.getStorageSync(config.anonymousKey) || ''
	if (!aid) {
		aid = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
		uni.setStorageSync(config.anonymousKey, aid)
	}
	return aid
}

export function setLogin(token, user) {
	uni.setStorageSync(config.tokenKey, token || '')
	uni.setStorageSync(config.userKey, user || {})
}

export function clearLogin() {
	uni.removeStorageSync(config.tokenKey)
	uni.removeStorageSync(config.userKey)
}

export function getToken() {
	return uni.getStorageSync(config.tokenKey) || ''
}

export function getUser() {
	return uni.getStorageSync(config.userKey) || {}
}

export function isWxUser() {
	const u = getUser()
	return !!(u && u.openid)
}

export function clearAllCache() {
	uni.clearStorageSync()
}

export default {
	ensureAnonymousId,
	setLogin,
	clearLogin,
	getToken,
	getUser,
	isWxUser,
	clearAllCache
}
