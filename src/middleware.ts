import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const response = NextResponse.next();
	
	// Thêm header để bỏ cảnh báo ngrok
	response.headers.set("ngrok-skip-browser-warning", "1");
	
	return response;
}

// Chạy middleware cho tất cả các route
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};

