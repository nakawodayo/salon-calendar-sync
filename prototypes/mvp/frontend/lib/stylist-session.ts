import { cookies } from 'next/headers';

const COOKIE_NAME = 'stylist_email';

/**
 * Cookie からスタイリスト ID（メールアドレス）を取得
 */
export async function getStylistId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}
