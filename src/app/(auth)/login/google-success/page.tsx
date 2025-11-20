"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";

export default function GoogleSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const backendToken = session?.backendToken;
      if (backendToken) {
        setToken(backendToken);
        window.location.href = "/";
      } else {
        router.replace("/login?error=missing_token");
      }
    } else if (status === "unauthenticated") {
      router.replace("/login?error=unauthenticated");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="animate-pulse text-lg font-medium text-foreground">
          Đang hoàn tất đăng nhập Google...
        </div>
        <p className="text-sm text-muted-foreground">
          Vui lòng chờ giây lát, chúng tôi đang đồng bộ hóa tài khoản của bạn.
        </p>
      </div>
    </div>
  );
}

