# uni_zeabur

参考 `self_server/uniPic` 的 UniApp 前端，对接 `zeabur_pro` 后端。

## 接口地址

线上：`https://haiwaiting.cn`

配置文件：`common/config.js`

## 功能

- 登录
- 首页
- 用户管理
- 系统配置
- 我的 / 退出

## 默认账号

`admin` / `123456`

## 本地运行

用 HBuilderX 打开本项目，运行到浏览器 / 微信开发者工具。

本地调试可把 `common/config.js` 里的 `baseUrl` 临时改成：

```js
baseUrl: 'http://localhost/zeabur_pro/public'
```
