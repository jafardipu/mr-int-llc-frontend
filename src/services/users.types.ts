export type UserRole = "retail" | "wholesale" | "admin" | "supper_admin";

export interface ProfileVerification {
  status: boolean;
}

export interface ProfileOrder {
  id: string;
  orderNumber: string;
  status: string;
  customerType: string;
  total: number;
  createdAt: string;
}

/**
 * The one-time wholesale account fee as `/users/my-profile` reports it.
 * null for accounts that never owed one (retail, older wholesale accounts).
 */
export interface ProfileWholesaleFee {
  status: "pending" | "paid" | null;
  amount: number | null;
  paidAt: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  role: UserRole;
  profile: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  verification: ProfileVerification;
  address: unknown[];
  deviceHistory: unknown[];
  wholesaleFee: ProfileWholesaleFee | null;
}

export interface MyProfile extends UserProfile {
  orders: ProfileOrder[];
}

export interface UpdateMyProfileInput {
  name?: string;
  phoneNumber?: string;
  profileFile?: File;
}
