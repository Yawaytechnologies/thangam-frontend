export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DIRECTOR'
  | 'EXECUTIVE_DIRECTOR'
  | 'DEPUTY_DIRECTOR'
  | 'SENIOR_MANAGER'
  | 'BUSINESS_MANAGER'
  | 'AGENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type BranchStatus = 'ACTIVE' | 'INACTIVE';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'VILLA' | 'APARTMENT' | 'PLOT';
export type WorkflowStatus =
  | 'AVAILABLE'
  | 'BOOKING_INITIATED'
  | 'TOKEN_RECEIVED'
  | 'ADVANCE_PAYMENT'
  | 'REGISTRATION_PENDING'
  | 'FINAL_SETTLEMENT_PENDING'
  | 'COMPLETED';
export type BookingStatus =
  | 'BOOKING_INITIATED'
  | 'TOKEN_RECEIVED'
  | 'ADVANCE_PAYMENT'
  | 'REGISTRATION_PENDING'
  | 'FINAL_SETTLEMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';
export type BillingStatus = 'PENDING' | 'PARTIAL_PAYMENT' | 'PAID' | 'FINAL_SETTLEMENT' | 'COMPLETED';
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'GPAY' | 'UPI';
export type NotificationType =
  | 'ADMIN_ACTIVITY'
  | 'MEMBER_ACTIVITY'
  | 'BRANCH_ACTIVITY'
  | 'PROPERTY_ACTIVITY'
  | 'BOOKING_ACTIVITY'
  | 'BILLING_ACTIVITY'
  | 'SYSTEM_ACTIVITY'
  | 'TEAM_ACTIVITY';
export type NotificationStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'IMPORTANT';
export type MessageType =
  | 'BOOKING_FOLLOW_UP'
  | 'BILLING_FOLLOW_UP'
  | 'SETTLEMENT_REMINDER'
  | 'PROPERTY_WORKFLOW_UPDATE'
  | 'DOCUMENT_SUBMISSION_REMINDER'
  | 'GENERAL_MESSAGE';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  lastLoginAt?: string;
  admin?: Admin;
  member?: Member;
}

export interface Branch {
  id: string;
  branchCode: string;
  name: string;
  branchType?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  status: BranchStatus;
  createdAt: string;
  _count?: { admins: number; members: number };
}

export interface Admin {
  id: string;
  adminId: string;
  fullName: string;
  phone: string;
  email?: string;
  branchId: string;
  branch?: Branch;
  status: UserStatus;
  createdAt: string;
}

export interface Member {
  id: string;
  memberId: string;
  fullName: string;
  phone: string;
  email?: string;
  photo?: string;
  role: Role;
  branchId: string;
  branch?: Branch;
  reportsToId?: string;
  reportsTo?: Member;
  codeNumber?: string;
  status: UserStatus;
  createdAt: string;
}

export interface Property {
  id: string;
  propertyId: string;
  propertyName: string;
  projectName: string;
  plotNumber: string;
  propertyType: PropertyType;
  squareFeet?: number;
  workflowStatus: WorkflowStatus;
  city?: string;
  state?: string;
  createdAt: string;
  // detail-view fields (returned by getOne)
  bookingCount?: number;
  latestBookingStatus?: string | null;
  latestBooking?: Booking | null;
  latestBilling?: unknown | null;
  images?: { id: string; url: string; uploadedAt: string }[];
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  favourOf?: string;
  chequeNumber?: string;
  chequeDate?: string;
  gpayReference?: string;
  cashAmount?: number;
  totalAmount: number;
}

export interface BookingDenomination {
  id: string;
  bookingId: string;
  denomination: number;
  count: number;
  amount: number;
}

export interface Booking {
  id: string;
  bookingId: string;
  propertyId: string;
  branchId?: string;
  property?: Property;
  branch?: Branch;
  applicantName: string;
  relation?: string;
  applicantAddress?: string;
  pinCode?: string;
  cellNumber: string;
  dateOfBirth?: string;
  weddingDay?: string;
  projectName: string;
  plotNumber: string;
  squareFeet?: number;
  bookingDate: string;
  edDdSmBmName?: string;
  referenceCode?: string;
  directorName?: string;
  signatureUrl?: string;
  status: BookingStatus;
  payments?: BookingPayment[];
  denominations?: BookingDenomination[];
  createdAt: string;
}

export interface Billing {
  id: string;
  billingId: string;
  bookingId: string;
  branchId?: string;
  booking?: Booking;
  buyerName: string;
  buyerPhone: string;
  buyerAddress?: string;
  orderNumber?: string;
  billingNumber?: string;
  paymentMethod: PaymentMethod;
  amountInNumbers: number;
  amountInWords: string;
  totalReceived: number;
  totalBalance: number;
  operationalNotes?: string;
  settlementNotes?: string;
  termsConditions?: string;
  signatureUrl?: string;
  status: BillingStatus;
  billingDate: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: string;
  bookingId?: string;
  billingId?: string;
  propertyId?: string;
  branchId?: string;
  createdAt: string;
  recipients?: NotificationRecipient[];
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId: string;
  status: NotificationStatus;
  readAt?: string;
  notification?: Notification;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
