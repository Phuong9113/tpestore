import "next-auth";
import "next-auth/jwt";

import type { AuthUser } from "@/lib/auth";

declare module "next-auth" {
	interface Session {
		backendToken?: string;
		user?: AuthUser;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		backendToken?: string;
		user?: AuthUser;
	}
}

