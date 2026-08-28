/**
 * Central Firestore data-access layer.
 * Every page should go through these helpers instead of calling
 * firestore functions directly — keeps query shape, pagination,
 * and demo-mode fallbacks consistent across the app.
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  average,
  count,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isDemoMode } from '../firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = 'user' | 'driver' | 'admin';

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  notificationsEnabled?: boolean;
  savedAddresses?: SavedAddress[];
  createdAt?: Timestamp;
}

export interface TruckPhotos {
  front?: string;
  back?: string;
  side?: string;
  plate?: string;
}

export interface DriverDocuments {
  license?: string;
  insurance?: string;
  registration?: string;
  permit?: string;
}

export interface DriverProfile {
  uid: string;
  displayName: string;
  email: string;
  vehicleType: string;
  plateNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  isOnline: boolean;
  isVerified: boolean;
  documentsStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  createdAt?: Timestamp;
  // Multi-step onboarding, captured after account creation and before
  // document upload — see pages/driver/DriverOnboarding.tsx.
  onboardingStatus?: 'pending' | 'complete';
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  nin?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  truckYear?: string;
  chassisNumber?: string;
  capacityTons?: string;
  truckPhotos?: TruckPhotos;
  documents?: DriverDocuments;
}

export type BookingStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'cancelled';

export interface Coords {
  lat: number;
  lng: number;
}

export interface Booking {
  id?: string;
  userId: string;
  userName: string;
  userPhone?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  truckId: string;
  truckName: string;
  pickupLocation: string;
  pickupCoords: Coords;
  destination: string;
  destinationCoords: Coords;
  distanceKm: number;
  price: number;
  paymentMethod?: 'paystack' | 'flutterwave' | 'wallet';
  paymentRef?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: BookingStatus;
  createdAt?: Timestamp;
  scheduledAt?: Timestamp;
  // Cargo condition photos + AI damage comparison -- see lib/ai.ts and
  // pages/driver/ActiveTrip.tsx. Advisory only, not a binding claims record.
  cargoPhotos?: { pickup?: string; delivery?: string };
  cargoDamageReport?: { hasDamage: boolean; concerns: string[]; summary: string };
}

export interface Truck {
  id?: string;
  name: string;
  category: string;
  capacity: string;
  pricePerKm: number;
  image: string;
  available: boolean;
}

export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
  updatedAt?: Timestamp;
}

export interface LocationPing {
  lat: number;
  lng: number;
  speedKmh?: number;
  timestamp?: Timestamp;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  createdAt?: Timestamp;
}

export interface AppNotification {
  id?: string;
  title: string;
  body: string;
  type: 'booking' | 'payment' | 'system' | 'chat';
  read: boolean;
  createdAt?: Timestamp;
}

export interface WalletTransaction {
  id?: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference?: string;
  createdAt?: Timestamp;
}

export interface Review {
  id?: string;
  bookingId: string;
  userId: string;
  userName: string;
  driverId: string;
  rating: number;
  comment: string;
  createdAt?: Timestamp;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function createUserProfile(profile: Omit<UserProfile, 'createdAt'>) {
  await setDoc(doc(db, 'users', profile.uid), { ...profile, createdAt: serverTimestamp() });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function deleteUserProfile(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

export function watchUserProfile(uid: string, cb: (profile: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function listUsersPage(pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const base = [collection(db, 'users'), orderBy('createdAt', 'desc'), limit(pageSize)] as const;
  const q = cursor ? query(base[0], base[1], startAfter(cursor), base[2]) : query(...base);
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => d.data() as UserProfile),
    lastDoc: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === pageSize,
  };
}

// ---------------------------------------------------------------------------
// Driver profiles
// ---------------------------------------------------------------------------

export async function createDriverProfile(uid: string, profile: Omit<DriverProfile, 'uid' | 'createdAt'>) {
  await setDoc(doc(db, 'driverProfiles', uid), { uid, ...profile, createdAt: serverTimestamp() });
}

export async function getDriverProfile(uid: string): Promise<DriverProfile | null> {
  const snap = await getDoc(doc(db, 'driverProfiles', uid));
  return snap.exists() ? (snap.data() as DriverProfile) : null;
}

export async function updateDriverProfile(uid: string, data: Partial<DriverProfile>) {
  await updateDoc(doc(db, 'driverProfiles', uid), data);
}

export async function listDriversPage(pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const q = cursor
    ? query(collection(db, 'driverProfiles'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'driverProfiles'), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => d.data() as DriverProfile),
    lastDoc: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === pageSize,
  };
}

export async function listOnlineDrivers(): Promise<DriverProfile[]> {
  const q = query(collection(db, 'driverProfiles'), where('isOnline', '==', true), where('isVerified', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as DriverProfile);
}

// ---------------------------------------------------------------------------
// Trucks
// ---------------------------------------------------------------------------

export async function listTrucks(): Promise<Truck[]> {
  const snap = await getDocs(collection(db, 'trucks'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Truck) }));
}

export async function getTruck(truckId: string): Promise<Truck | null> {
  const snap = await getDoc(doc(db, 'trucks', truckId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Truck) }) : null;
}

export async function seedTrucksIfEmpty(seed: Omit<Truck, 'id'>[]) {
  const existing = await getDocs(collection(db, 'trucks'));
  if (!existing.empty) return;
  await Promise.all(seed.map((t) => addDoc(collection(db, 'trucks'), t)));
}

export async function createTruck(truck: Omit<Truck, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'trucks'), truck);
  return ref.id;
}

export async function updateTruck(truckId: string, data: Partial<Truck>) {
  await updateDoc(doc(db, 'trucks', truckId), data);
}

export async function deleteTruck(truckId: string) {
  await deleteDoc(doc(db, 'trucks', truckId));
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'bookings'), { ...booking, createdAt: serverTimestamp() });
  return ref.id;
}

export async function getBooking(bookingId: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, 'bookings', bookingId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Booking) }) : null;
}

export function watchBooking(bookingId: string, cb: (b: Booking | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Booking) }) : null);
  });
}

export async function updateBooking(bookingId: string, data: Partial<Booking>) {
  await updateDoc(doc(db, 'bookings', bookingId), data);
}

export async function listUserBookingsPage(userId: string, pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const q = cursor
    ? query(collection(db, 'bookings'), where('userId', '==', userId), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'bookings'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Booking) })),
    lastDoc: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === pageSize,
  };
}

export async function listDriverBookingsPage(driverId: string, pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const q = cursor
    ? query(collection(db, 'bookings'), where('driverId', '==', driverId), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'bookings'), where('driverId', '==', driverId), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Booking) })),
    lastDoc: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === pageSize,
  };
}

export async function listAllBookingsPage(pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const q = cursor
    ? query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Booking) })),
    lastDoc: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === pageSize,
  };
}

export function watchPendingBookings(cb: (bookings: Booking[]) => void): Unsubscribe {
  const q = query(collection(db, 'bookings'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Booking) }))));
}

export async function listAdmins(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'admin'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function countUserBookings(userId: string): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, 'bookings'), where('userId', '==', userId)));
  return snap.data().count;
}

// ---------------------------------------------------------------------------
// Live driver location (one doc per active booking)
// ---------------------------------------------------------------------------

export async function pushDriverLocation(bookingId: string, loc: Omit<DriverLocation, 'updatedAt'>) {
  await setDoc(doc(db, 'driverLocations', bookingId), { ...loc, updatedAt: serverTimestamp() }, { merge: true });
}

export function watchDriverLocation(bookingId: string, cb: (loc: DriverLocation | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'driverLocations', bookingId), (snap) => {
    cb(snap.exists() ? (snap.data() as DriverLocation) : null);
  });
}

export function watchAllDriverLocations(cb: (locations: Record<string, DriverLocation>) => void): Unsubscribe {
  return onSnapshot(collection(db, 'driverLocations'), (snap) => {
    const map: Record<string, DriverLocation> = {};
    snap.docs.forEach((d) => { map[d.id] = d.data() as DriverLocation; });
    cb(map);
  });
}

// Append-only history of GPS pings for one trip, used to compute a safety
// score after the fact (see lib/safety.ts) -- the top-level driverLocations
// doc above is overwritten on every update, so it alone can't tell you
// anything about speed changes over the course of a trip.
export async function pushLocationPing(bookingId: string, ping: Omit<LocationPing, 'timestamp'>) {
  await addDoc(collection(db, 'driverLocations', bookingId, 'pings'), { ...ping, timestamp: serverTimestamp() });
}

export async function listLocationPings(bookingId: string): Promise<LocationPing[]> {
  const q = query(collection(db, 'driverLocations', bookingId, 'pings'), orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LocationPing);
}

// ---------------------------------------------------------------------------
// Chat (subcollection per booking)
// ---------------------------------------------------------------------------

export async function sendChatMessage(bookingId: string, msg: Omit<ChatMessage, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'bookings', bookingId, 'messages'), { ...msg, createdAt: serverTimestamp() });
}

export function watchChatMessages(bookingId: string, cb: (messages: ChatMessage[]) => void): Unsubscribe {
  const q = query(collection(db, 'bookings', bookingId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ChatMessage) }))));
}

// ---------------------------------------------------------------------------
// Notifications (subcollection per user)
// ---------------------------------------------------------------------------

export async function pushNotification(uid: string, note: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
  await addDoc(collection(db, 'users', uid, 'notifications'), { ...note, read: false, createdAt: serverTimestamp() });
}

export function watchNotifications(uid: string, cb: (items: AppNotification[]) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as AppNotification) }))));
}

export async function markNotificationRead(uid: string, notificationId: string) {
  await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true });
}

// ---------------------------------------------------------------------------
// Wallet (subcollection per user)
// ---------------------------------------------------------------------------

export async function addWalletTransaction(uid: string, tx: Omit<WalletTransaction, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'users', uid, 'walletTransactions'), { ...tx, createdAt: serverTimestamp() });
}

export async function listWalletTransactionsPage(uid: string, pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const q = cursor
    ? query(collection(db, 'users', uid, 'walletTransactions'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize))
    : query(collection(db, 'users', uid, 'walletTransactions'), orderBy('createdAt', 'desc'), limit(pageSize));
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...(d.data() as WalletTransaction) })),
    lastDoc: snap.docs[snap.docs.length - 1],
    hasMore: snap.docs.length === pageSize,
  };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function createReview(review: Omit<Review, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'reviews'), { ...review, createdAt: serverTimestamp() });
}

export async function listDriverReviews(driverId: string): Promise<Review[]> {
  const q = query(collection(db, 'reviews'), where('driverId', '==', driverId), orderBy('createdAt', 'desc'), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Review) }));
}

// DriverProfile.rating is never actually written -- a customer submitting a
// review isn't the driver or an admin, and firestore.rules correctly
// doesn't let them touch a trust field like rating (that write used to be
// attempted here and always silently failed). Derive it live from the
// reviews collection instead, same approach as getDriverStats.
export async function getDriverRating(driverId: string): Promise<{ rating: number; reviewCount: number }> {
  const q = query(collection(db, 'reviews'), where('driverId', '==', driverId));
  const snap = await getAggregateFromServer(q, { rating: average('rating'), reviewCount: count() });
  const data = snap.data();
  return { rating: data.rating ?? 0, reviewCount: data.reviewCount };
}

export const firestoreReady = !isDemoMode;

// ---------------------------------------------------------------------------
// Admin aggregates
// ---------------------------------------------------------------------------

export interface AdminBookingStats {
  totalRevenue: number;
  totalBookings: number;
  activeShipments: number;
  pendingRequests: number;
}

export async function getAdminBookingStats(): Promise<AdminBookingStats> {
  const bookingsRef = collection(db, 'bookings');
  const [totalSnap, revenueSnap, activeSnap, pendingSnap] = await Promise.all([
    getCountFromServer(bookingsRef),
    getAggregateFromServer(query(bookingsRef, where('status', '==', 'delivered')), { total: sum('price') }),
    getCountFromServer(query(bookingsRef, where('status', 'in', ['assigned', 'in-transit']))),
    getCountFromServer(query(bookingsRef, where('status', '==', 'pending'))),
  ]);
  return {
    totalBookings: totalSnap.data().count,
    totalRevenue: revenueSnap.data().total || 0,
    activeShipments: activeSnap.data().count,
    pendingRequests: pendingSnap.data().count,
  };
}

export interface AdminFleetStats {
  availableTrucks: number;
  totalTrucks: number;
  onlineDrivers: number;
  totalDrivers: number;
  avgDriverRating: number;
  pendingVerifications: number;
}

export async function getAdminFleetStats(): Promise<AdminFleetStats> {
  const trucksRef = collection(db, 'trucks');
  const driversRef = collection(db, 'driverProfiles');
  const [totalTrucks, availableTrucks, totalDrivers, onlineDrivers, ratingAgg, pendingVerif] = await Promise.all([
    getCountFromServer(trucksRef),
    getCountFromServer(query(trucksRef, where('available', '==', true))),
    getCountFromServer(driversRef),
    getCountFromServer(query(driversRef, where('isOnline', '==', true))),
    getAggregateFromServer(driversRef, { avgRating: average('rating') }),
    getCountFromServer(query(driversRef, where('documentsStatus', '==', 'submitted'))),
  ]);
  return {
    totalTrucks: totalTrucks.data().count,
    availableTrucks: availableTrucks.data().count,
    totalDrivers: totalDrivers.data().count,
    onlineDrivers: onlineDrivers.data().count,
    avgDriverRating: ratingAgg.data().avgRating || 0,
    pendingVerifications: pendingVerif.data().count,
  };
}

export interface BookingStatusCounts {
  pending: number;
  assigned: number;
  'in-transit': number;
  delivered: number;
  cancelled: number;
}

// Trip count and earnings are derived live from delivered bookings rather
// than a denormalized counter on DriverProfile -- firestore.rules doesn't
// let a driver self-update totalTrips/totalEarnings (correctly: they're
// trust/financial fields), so a client-side counter update would always be
// rejected. Deriving them from `bookings` needs no privileged write at all.
export async function getDriverStats(driverId: string): Promise<{ totalTrips: number; totalEarnings: number }> {
  const q = query(collection(db, 'bookings'), where('driverId', '==', driverId), where('status', '==', 'delivered'));
  const snap = await getAggregateFromServer(q, { totalTrips: count(), totalEarnings: sum('price') });
  return { totalTrips: snap.data().totalTrips, totalEarnings: snap.data().totalEarnings };
}

export async function getBookingStatusCounts(): Promise<BookingStatusCounts> {
  const bookingsRef = collection(db, 'bookings');
  const statuses: BookingStatus[] = ['pending', 'assigned', 'in-transit', 'delivered', 'cancelled'];
  const results = await Promise.all(statuses.map((s) => getCountFromServer(query(bookingsRef, where('status', '==', s)))));
  return {
    pending: results[0].data().count,
    assigned: results[1].data().count,
    'in-transit': results[2].data().count,
    delivered: results[3].data().count,
    cancelled: results[4].data().count,
  };
}
