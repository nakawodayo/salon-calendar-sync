import liff from '@line/liff';

/**
 * LIFF SDK の初期化
 * @param liffId LIFF ID
 */
export const initializeLiff = async (liffId: string): Promise<void> => {
  try {
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
    }
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    throw error;
  }
};

/**
 * ユーザープロフィールの取得
 * @returns ユーザー ID と表示名
 */
export const getUserProfile = async (): Promise<{
  userId: string;
  displayName: string;
}> => {
  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
};

/**
 * LIFF ログイン状態の確認
 * @returns ログイン済みかどうか
 */
export const isLoggedIn = (): boolean => {
  return liff.isLoggedIn();
};

/**
 * LIFF ログアウト
 */
export const logout = (): void => {
  liff.logout();
};
