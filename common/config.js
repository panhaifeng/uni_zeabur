// 线上后端域名（Zeabur）
const BASE_URL = 'https://haiwaiting.cn';

export default {
	baseUrl: BASE_URL,
	// 本地调试可改为：
	// baseUrl: 'http://localhost/zeabur_pro/public',
	apiPrefix: '/api',
	tokenKey: 'mole_token',
	userKey: 'mole_user',
	anonymousKey: 'mole_anonymous_id',
	// 流量主广告位：填入微信后台真实 adunit-xxx 后自动显示；占位/空则隐藏，不报错
	adBannerUnitId: '',
	adInterstitialUnitId: '',
	disclaimer: '本为单词趣味练习工具，不属于教育培训，不保证学习效果。'
};
