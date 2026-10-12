import config from '@/common/config.js';

export function setLogin(token, user) {
	uni.setStorageSync(config.tokenKey, token || '');
	uni.setStorageSync(config.userKey, user || {});
}

export function clearLogin() {
	uni.removeStorageSync(config.tokenKey);
	uni.removeStorageSync(config.userKey);
}

export function getUser() {
	return uni.getStorageSync(config.userKey) || {};
}

export function isLogin() {
	return !!uni.getStorageSync(config.tokenKey);
}

export default {
	setLogin,
	clearLogin,
	getUser,
	isLogin
};
