import config from '@/common/config.js';

function getToken() {
	return uni.getStorageSync(config.tokenKey) || '';
}

function request(options = {}) {
	const url = (options.url || '').indexOf('http') === 0
		? options.url
		: config.baseUrl + config.apiPrefix + options.url;

	const header = Object.assign({
		'content-type': 'application/x-www-form-urlencoded'
	}, options.header || {});

	const token = getToken();
	if (token) {
		header.token = token;
	}

	return new Promise((resolve, reject) => {
		uni.request({
			url,
			method: options.method || 'GET',
			data: options.data || {},
			header,
			success: (res) => {
				const data = res.data || {};
				if (data.code === 401) {
					uni.removeStorageSync(config.tokenKey);
					uni.removeStorageSync(config.userKey);
					uni.reLaunch({ url: '/pages/login/login' });
					reject(data);
					return;
				}
				resolve(data);
			},
			fail: (err) => {
				uni.showToast({ icon: 'none', title: '网络请求失败' });
				reject(err);
			}
		});
	});
}

export function get(url, data = {}, header = {}) {
	return request({ url, method: 'GET', data, header });
}

export function post(url, data = {}, header = {}) {
	return request({ url, method: 'POST', data, header });
}

export default {
	request,
	get,
	post,
	getToken
};
