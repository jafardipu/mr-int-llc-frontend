export type PrepServiceStatus =
  | "under_review"
  | "correction_required"
  | "completed";

export interface PrepServiceUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface PrepServiceRequest {
  id: string;
  userId: string;
  serviceType: string;
  status: PrepServiceStatus;
  notes: string | null;
  attachments: string[];
  adminNote: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: PrepServiceUser;
}

export interface CreatePrepServiceInput {
  serviceType: string;
  notes?: string;
  attachments?: File[];
}

export interface UpdatePrepServiceStatusInput {
  status: PrepServiceStatus;
  adminNote?: string;
}

export interface PrepServiceQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: PrepServiceStatus;
  sort?: string;
}

export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

