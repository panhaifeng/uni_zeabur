// 接口基础地址：线上绑定的 Zeabur 后端域名
const BASE_URL = 'https://haiwaiting.cn';

export default {
	baseUrl: BASE_URL,
	// 本地调试可临时改成：
	// baseUrl: 'http://localhost/zeabur_pro/public',
	apiPrefix: '/api',
	tokenKey: 'uni_zeabur_token',
	userKey: 'uni_zeabur_user'
};
