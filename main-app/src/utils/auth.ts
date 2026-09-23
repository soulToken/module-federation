/**
 * 主应用全局认证与用户信息服务 (Auth Service)
 * 供主应用自身以及所有微应用子应用共同消费
 */

export interface UserInfo {
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  role: 'VIP' | 'SUPER_VIP' | 'NORMAL';
  points: number;
}

let currentToken = 'mock_jwt_token_h5_2026_xyz';
let currentUser: UserInfo = {
  userId: 'U-889901',
  username: 'antigravity_coder',
  nickname: '极客小明 (主应用登录态)',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=h5-master',
  role: 'SUPER_VIP',
  points: 1280
};

export const authService = {
  getToken(): string {
    return currentToken;
  },

  getUserInfo(): UserInfo {
    return { ...currentUser };
  },

  updatePoints(delta: number): UserInfo {
    currentUser.points += delta;
    return { ...currentUser };
  },

  logout(): void {
    currentToken = '';
    console.log('[MainApp Auth] 用户已登出');
  }
};
