import apiClient from "@/lib/apiClient";
import type {
  PrepServiceList,
  PrepServiceQueryParams,
  PrepServiceRequest,
  PrepServiceStatus,
  PrepServiceUser,
} from "@/types/prepService";

/*
 * Customer prep-service endpoints. Responses are `{ success, message, data }`
 * and are parsed from `unknown` here so the UI only sees well-formed requests.
 */

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const statuses = new Set<PrepServiceStatus>([
  "under_review",
  "correction_required",
  "completed",
]);

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readUser(value: unknown): PrepServiceUser | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  return {
    id: value.id,
    name: readString(value.name),
    email: readString(value.email) ?? "",
    role: readString(value.role) ?? "",
    phoneNumber: readString(value.phoneNumber),
    profile: readString(value.profile),
  };
}

export function readPrepRequest(value: unknown): PrepServiceRequest | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  const status =
    typeof value.status === "string" && statuses.has(value.status as PrepServiceStatus)
      ? (value.status as PrepServiceStatus)
      : "under_review";

  return {
    id: value.id,
    userId: readString(value.userId) ?? "",
    status,
    attachments: Array.isArray(value.attachments)
      ? value.attachments.filter(
          (url): url is string => typeof url === "string" && url.trim() !== "",
        )
      : [],
    adminNote: readString(value.adminNote)?.trim() || null,
    createdAt: readString(value.createdAt) ?? "",
    updatedAt: readString(value.updatedAt) ?? readString(value.createdAt) ?? "",
    user: readUser(value.user),
  };
}

function unwrapData(body: unknown, resource: string): unknown {
  if (!isRecord(body) || !("data" in body)) {
    throw new Error(`The server returned an unexpected response for ${resource}.`);
  }
  return body.data;
}

function readRequestResponse(body: unknown, resource: string): PrepServiceRequest {
  const request = readPrepRequest(unwrapData(body, resource));
  if (!request) {
    throw new Error(`The server returned an invalid prep request for ${resource}.`);
  }
  return request;
}

function readListResponse(
  body: unknown,
  params: PrepServiceQueryParams,
): PrepServiceList {
  const data = unwrapData(body, "prep-services/my");
  const items = isRecord(data) && Array.isArray(data.data) ? data.data : [];
  const meta = isRecord(data) && isRecord(data.meta) ? data.meta : {};

  return {
    data: items.flatMap((item) => {
      const request = readPrepRequest(item);
      return request ? [request] : [];
    }),
    meta: {
      page: readNumber(meta.page, params.page ?? 1),
      limit: readNumber(meta.limit, params.limit ?? 10),
      total: readNumber(meta.total, items.length),
    },
  };
}

/** One `attachments` field per file. No Content-Type header: the browser adds the multipart boundary. */
function attachmentsFormData(files: File[]) {
  const formData = new FormData();
  for (const file of files) formData.append("attachments", file);
  return formData;
}

export const prepServiceApi = {
  /** POST /prep-services — files only. Returns the new request (`under_review`). */
  create: async (files: File[]): Promise<PrepServiceRequest> => {
    const res = await apiClient.post("/prep-services", attachmentsFormData(files));
    return readRequestResponse(res.data, "prep-services");
  },

  /** GET /prep-services/my — paginated, newest first by default. */
  getMyRequests: async (
    params: PrepServiceQueryParams = {},
  ): Promise<PrepServiceList> => {
    const res = await apiClient.get("/prep-services/my", { params });
    return readListResponse(res.data, params);
  },

  /** GET /prep-services/:id — 403 for anyone but the owner. */
  getById: async (id: string): Promise<PrepServiceRequest> => {
    const resource = `prep-services/${encodeURIComponent(id)}`;
    const res = await apiClient.get(`/${resource}`);
    return readRequestResponse(res.data, resource);
  },

  /**
   * PATCH /prep-services/:id/resubmit — only while `correction_required`.
   * Replaces ALL previous files. 400 if the status is wrong, 409 if the request
   * changed in the meantime.
   */
  resubmit: async (id: string, files: File[]): Promise<PrepServiceRequest> => {
    const resource = `prep-services/${encodeURIComponent(id)}/resubmit`;
    const res = await apiClient.patch(`/${resource}`, attachmentsFormData(files));
    return readRequestResponse(res.data, resource);
  },
};
