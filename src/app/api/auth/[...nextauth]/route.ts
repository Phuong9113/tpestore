import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const requiredEnv = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_SECRET"] as const;
requiredEnv.forEach((key) => {
	if (!process.env[key]) {
		console.warn(`[NextAuth] Missing environment variable: ${key}`);
	}
});

const apiBase =
	process.env.API_BASE_URL ||
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	"http://localhost:4000";
const backendBase = apiBase.replace(/\/$/, "");
const backendAuthUrl = `${backendBase}/api/v1/auth/google`;

const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	// NEXTAUTH_URL sẽ được tự động detect từ request nếu không set
	// Hoặc có thể set trong .env: NEXTAUTH_URL="https://your-ngrok-url.ngrok-free.dev"
	session: { strategy: "jwt" },
	pages: {
		signIn: "/login",
	},
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account?.provider === "google" && profile) {
				const email = profile.email;
				const providerId = account.providerAccountId;
				if (!email || !providerId) {
					throw new Error("Không nhận được thông tin email từ Google");
				}
				const payload = { email: String(email).toLowerCase(), providerId, name: profile.name || profile.given_name };
				try {
					const res = await fetch(backendAuthUrl, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
						cache: "no-store",
					});
					if (!res.ok) {
						const errorText = await res.text();
						console.error(`[NextAuth] Backend error: ${res.status} - ${errorText}`);
						const message = `Không thể đồng bộ tài khoản Google (status ${res.status})`;
						throw new Error(message);
					}
					const json = await res.json();
					const data = json?.data ?? json;
					token.backendToken = data.token;
					token.user = data.user;
				} catch (error) {
					console.error("[NextAuth] Error calling backend:", error);
					throw error;
				}
			}
			return token;
		},
		async session({ session, token }) {
			if (token?.backendToken) {
				session.backendToken = token.backendToken;
			}
			if (token?.user) {
				session.user = token.user;
			}
			return session;
		},
	},
	debug: process.env.NODE_ENV === "development",
};

// NextAuth v4 với Next.js 15 App Router - export handler trực tiếp
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

