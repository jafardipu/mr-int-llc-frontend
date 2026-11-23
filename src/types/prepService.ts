export type PrepServiceStatus =
  | "under_review"
  | "correction_required"
  | "completed";

export interface PrepServiceUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phoneNumber: string | null;
  profile: string | null;
}

/** A customer's prep request. It only carries files; there are no other fields. */
export interface PrepServiceRequest {
  id: string;
  userId: string;
  status: PrepServiceStatus;
  /** File URLs. The file name is the last path segment. */
  attachments: string[];
  /** Set by the admin when asking for changes (and optionally on approval). */
  adminNote: string | null;
  /** When the request was submitted. */
  createdAt: string;
  /** When it last changed (review, resubmission). */
  updatedAt: string;
  user: PrepServiceUser | null;
}

export interface PrepServiceListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PrepServiceList {
  data: PrepServiceRequest[];
  meta: PrepServiceListMeta;
}

export interface PrepServiceQueryParams {
  page?: number;
  limit?: number;
  status?: PrepServiceStatus;
  /** Comma-separated fields, `-` prefix for descending. Newest first by default. */
  sort?: string;
}
