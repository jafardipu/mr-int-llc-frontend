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
}

export interface MyProfile extends UserProfile {
  orders: ProfileOrder[];
}

export interface UpdateMyProfileInput {
  name?: string;
  phoneNumber?: string;
  profileFile?: File;
}
