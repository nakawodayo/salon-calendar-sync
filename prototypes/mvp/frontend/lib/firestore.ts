import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ReservationRequest, CreateReservationRequestData, StylistToken } from '@/types/reservation';

const RESERVATIONS_COLLECTION = 'reservationRequests';
const STYLIST_TOKENS_COLLECTION = 'stylistTokens';

/**
 * 予約リクエストを作成
 */
export async function createReservation(data: CreateReservationRequestData): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, RESERVATIONS_COLLECTION), {
    ...data,
    status: 'requested',
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/**
 * 予約リクエストを ID で取得
 */
export async function getReservation(id: string): Promise<ReservationRequest | null> {
  const docRef = doc(db, RESERVATIONS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as ReservationRequest;
}

/**
 * 顧客 ID で予約リクエストを取得
 */
export async function getReservationsByCustomer(customerId: string): Promise<ReservationRequest[]> {
  const q = query(
    collection(db, RESERVATIONS_COLLECTION),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReservationRequest));
}

/**
 * 全予約リクエストを取得（スタイリスト用）
 */
export async function getAllReservations(): Promise<ReservationRequest[]> {
  const q = query(
    collection(db, RESERVATIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ReservationRequest));
}

/**
 * 予約リクエストのステータスを更新
 */
export async function updateReservationStatus(
  id: string,
  status: ReservationRequest['status'],
  additionalData?: Partial<ReservationRequest>
): Promise<void> {
  const docRef = doc(db, RESERVATIONS_COLLECTION, id);
  await updateDoc(docRef, {
    status,
    ...additionalData,
    updatedAt: Timestamp.now(),
  });
}

/**
 * スタイリストの Google OAuth トークンを保存
 */
export async function saveStylistToken(stylistId: string, token: StylistToken): Promise<void> {
  const docRef = doc(db, STYLIST_TOKENS_COLLECTION, stylistId);
  const { setDoc } = await import('firebase/firestore');
  await setDoc(docRef, {
    ...token,
    updatedAt: Timestamp.now(),
  });
}

/**
 * スタイリストの Google OAuth トークンを取得
 */
export async function getStylistToken(stylistId: string): Promise<StylistToken | null> {
  const docRef = doc(db, STYLIST_TOKENS_COLLECTION, stylistId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as StylistToken;
}
