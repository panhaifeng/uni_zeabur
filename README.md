# 单词打地鼠大挑战

UniApp Vue2 微信小程序 + ThinkPHP 5.1 后端。

## 使用步骤

### 1. 导入数据库

在 MySQL 执行：

`zeabur_pro/database/word_mole.sql`

### 2. 配置微信

编辑 `zeabur_pro/config/wechat.php`：

```php
'appid' => '你的小程序AppID',
'appsecret' => '你的AppSecret',
```

前端 `manifest.json` → `mp-weixin.appid` 填同一 AppID。

### 3. 广告位

`uni_zeabur/common/config.js`：

- `adBannerUnitId` 首页 Banner
- `adInterstitialUnitId` 结算插屏

### 4. 接口地址

`common/config.js` → `baseUrl: 'https://haiwaiting.cn'`

本地可改为：`http://localhost/zeabur_pro/public`

### 5. 运行

HBuilderX 打开 `uni_zeabur`，运行到微信开发者工具。

## 页面

- index 首页
- select 词库难度
- game 打地鼠
- result 结算
- mine 生词/战绩/徽章

## 说明

本为单词趣味练习工具，不属于教育培训，不保证学习效果。
无激励视频、付费、分享奖励、排行榜。
