
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE'
}

export enum RoomType {
  STANDARD = 'Standard',
  DELUXE = 'Deluxe',
  SUITE = 'Suite'
}

export enum PaymentMethod {
  CASH = 'CASH',
  GCASH = 'GCASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Room {
  id: number;
  number: string;
  type: RoomType;
  status: RoomStatus;
  baseRate: number;
  weekendRate: number;
}

export interface HotelSettings {
  name: string;
  currency: string;
  receiptHeader?: string;
  receiptFooter?: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
}

export interface Booking {
  id: string;
  roomId: number;
  guestId: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  specialRequests?: string;
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  recordedBy: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  actionType: 'CREATE' | 'EDIT' | 'DELETE' | 'CHECK_IN' | 'CHECK_OUT' | 'PAYMENT' | 'CANCEL' | 'SYSTEM';
  entityType: 'BOOKING' | 'ROOM' | 'PAYMENT' | 'USER' | 'GUEST' | 'SYSTEM';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  loginTime: string;
}
