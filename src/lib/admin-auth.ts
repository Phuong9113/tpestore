import { me, type AuthUser } from './auth';

export async function requireAdmin(): Promise<AuthUser> {
  const user = await me();
  if (!user) {
    throw new Error('Cần đăng nhập để truy cập trang này');
  }
  if (user.role !== 'ADMIN') {
    throw new Error('Bạn không có quyền truy cập trang quản trị');
  }
  return user;
}
