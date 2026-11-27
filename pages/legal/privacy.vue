<template>
	<view class="page">
		<view class="title">隐私政策</view>
		<view class="meta">更新日期：2026年11月26日 · 生效日期：2026年11月26日</view>

		<view class="section">
			<view class="h">一、引言</view>
			<view class="p">欢迎使用「单词打地鼠」（以下简称“本小程序”）。本小程序由运营方（网站：haiwaiting.cn，以下简称“我们”）提供。我们重视您的个人信息保护，本政策说明我们如何收集、使用、存储与保护您的信息。请您在使用相关功能前仔细阅读并确认同意。</view>
		</view>

		<view class="section">
			<view class="h">二、我们收集的信息</view>
			<view class="p">1. 账号与标识信息：为保障基础功能可用，我们可能收集微信登录相关标识、昵称、头像（若您主动授权登录），以及用于游客模式的设备侧匿名标识。</view>
			<view class="p">2. 业务数据：您在使用过程中产生的对局记录、生词本、徽章等学习练习数据，用于为您提供同步与展示服务。</view>
			<view class="p">3. 「提建议」功能相关信息：当您主动提交建议时，我们仅收集您填写的建议内容，用于产品改进。本功能不收集手机号、微信号等联系方式或身份信息。</view>
			<view class="p">4. 我们不会以隐瞒或强制方式收集与功能无关的个人信息，也不会收集您的手机号码。</view>
		</view>

		<view class="section">
			<view class="h">三、信息使用目的与方式</view>
			<view class="p">1. 用于提供、维护与改进单词练习、账号同步、生词与战绩等核心功能。</view>
			<view class="p">2. 用于接收并处理您提交的产品建议与问题反馈（仅建议内容，不含联系方式）。</view>
			<view class="p">3. 用于保障安全、排查故障与满足法律法规要求。</view>
			<view class="p">4. 未经您同意，我们不会将您的个人信息出售给第三方，也不会用于与上述目的无关的营销。</view>
		</view>

		<view class="section">
			<view class="h">四、信息存储与保护</view>
			<view class="p">1. 您的信息存储于我们部署在中国境内的服务器中。</view>
			<view class="p">2. 我们采取合理的安全措施保护信息，防止未经授权的访问、披露、篡改或丢失。</view>
			<view class="p">3. 我们仅在实现本政策所述目的所必需的期限内保留信息；超期或您提出合理删除请求后，我们将依法删除或匿名化处理。</view>
		</view>

		<view class="section">
			<view class="h">五、信息共享与对外提供</view>
			<view class="p">除法律法规另有规定、取得您单独同意，或为履行法定义务所必需外，我们不会向第三方共享您的个人信息。若未来确需委托处理，我们将要求受托方按本政策及法律规定保护您的信息。</view>
		</view>

		<view class="section">
			<view class="h">六、您的权利</view>
			<view class="p">您有权查询、更正与您相关的个人信息，并可申请删除「提建议」中提交的内容。您可通过小程序内「提建议」或「我的」页面中的相关入口与我们联系。对于微信授权登录信息，您也可在微信客户端中管理授权。</view>
		</view>

		<view class="section">
			<view class="h">七、未成年人保护</view>
			<view class="p">若您为未成年人，请在监护人指导下阅读本政策并使用本小程序。我们不会主动定向收集未成年人的个人信息。</view>
		</view>

		<view class="section">
			<view class="h">八、政策更新</view>
			<view class="p">我们可能适时更新本政策。更新后将通过小程序页面展示等方式告知。若您继续使用相关功能，即表示您知悉更新内容；涉及重大变更的，我们将重新征求您的同意。</view>
		</view>

		<view class="section">
			<view class="h">九、联系我们</view>
			<view class="p">如对本政策或个人信息处理有疑问，可通过小程序「提建议」功能联系我们，网站：haiwaiting.cn。</view>
		</view>
	</view>
</template>

<script>
	export default {}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		padding: 32rpx 28rpx 80rpx;
		box-sizing: border-box;
		background: #F7FBF9;
	}
	.title {
		font-size: 40rpx;
		font-weight: 800;
		color: #2A4A42;
	}
	.meta {
		margin-top: 12rpx;
		margin-bottom: 28rpx;
		font-size: 22rpx;
		color: #9AB8AE;
	}
	.section {
		margin-bottom: 28rpx;
		padding: 24rpx;
		border-radius: 20rpx;
		background: #fff;
		box-shadow: 0 8rpx 20rpx rgba(93, 186, 157, 0.06);
	}
	.h {
		font-size: 30rpx;
		font-weight: 700;
		color: #2F8A74;
		margin-bottom: 12rpx;
	}
	.p {
		font-size: 26rpx;
		line-height: 1.7;
		color: #3A5A52;
		margin-bottom: 10rpx;
	}
	.p:last-child {
		margin-bottom: 0;
	}
</style>
