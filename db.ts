
import { Room, Booking, Guest, Payment, User, ActivityLog, HotelSettings } from './types';
import { INITIAL_ROOMS } from './constants';

const KEYS = {
  ROOMS: 'hus_rooms',
  BOOKINGS: 'hus_bookings',
  GUESTS: 'hus_guests',
  PAYMENTS: 'hus_payments',
  USERS: 'hus_users',
  LOGS: 'hus_activity_logs',
  SETTINGS: 'hus_settings'
};

const get = (key: string, def: any) => {
  const data = localStorage.getItem(key);
  try { return data ? JSON.parse(data) : def; } catch { return def; }
};

const set = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export const db = {
  getRooms: (): Room[] => {
    const r = get(KEYS.ROOMS, []);
    return r.length > 0 ? r : INITIAL_ROOMS;
  },
  saveRooms: (rooms: Room[]) => set(KEYS.ROOMS, rooms),
  getBookings: (): Booking[] => get(KEYS.BOOKINGS, []),
  saveBookings: (bookings: Booking[]) => set(KEYS.BOOKINGS, bookings),
  getGuests: (): Guest[] => get(KEYS.GUESTS, []),
  saveGuests: (guests: Guest[]) => set(KEYS.GUESTS, guests),
  getPayments: (): Payment[] => get(KEYS.PAYMENTS, []),
  savePayments: (payments: Payment[]) => set(KEYS.PAYMENTS, payments),
  getUsers: (): User[] => get(KEYS.USERS, []),
  saveUsers: (users: User[]) => set(KEYS.USERS, users),
  getLogs: (): ActivityLog[] => get(KEYS.LOGS, []),
  saveLogs: (logs: ActivityLog[]) => set(KEYS.LOGS, logs),
  getSettings: (): HotelSettings => get(KEYS.SETTINGS, { name: 'Hus Hotel', currency: 'PHP' }),
  saveSettings: (settings: HotelSettings) => set(KEYS.SETTINGS, settings),
};
