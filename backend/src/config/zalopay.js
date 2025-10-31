export default {
	appId: process.env.ZALOPAY_APP_ID,
	key1: process.env.ZALOPAY_KEY1,
	key2: process.env.ZALOPAY_KEY2,
	createEndpoint:
		process.env.ZALOPAY_CREATE_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create",
	callbackUrl: process.env.ZALOPAY_SANDBOX_CALLBACK_URL,
};
