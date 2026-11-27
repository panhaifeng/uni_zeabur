import config from '@/common/config.js'

// 进程内缓存：避免同一次冷启动里并发请求在写入 Storage 前各自生成新 ID
let memoryAnonymousId = ''

export function ensureAnonymousId() {
	if (memoryAnonymousId) {
		return memoryAnonymousId
	}
	let aid = ''
	try {
		aid = uni.getStorageSync(config.anonymousKey) || ''
	} catch (e) {}
	if (!aid) {
		aid = 'anon_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
		try {
			uni.setStorageSync(config.anonymousKey, aid)
		} catch (e) {}
	}
	memoryAnonymousId = aid
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
	memoryAnonymousId = ''
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
