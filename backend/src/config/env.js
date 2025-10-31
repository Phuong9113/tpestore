import dotenv from "dotenv";

dotenv.config();

export const env = {
	NODE_ENV: process.env.NODE_ENV || "development",
	PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
	HOST: process.env.HOST || "0.0.0.0",
	JWT_SECRET: process.env.JWT_SECRET || "changeme",
	GHN_TOKEN: process.env.GHN_TOKEN || "",
	GHN_SHOP_ID: process.env.GHN_SHOP_ID || "",
	ZALOPAY_APP_ID: process.env.ZALOPAY_APP_ID || "",
	ZALOPAY_KEY1: process.env.ZALOPAY_KEY1 || "",
	ZALOPAY_KEY2: process.env.ZALOPAY_KEY2 || "",
	CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
