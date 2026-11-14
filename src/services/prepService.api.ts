import apiClient from "@/lib/apiClient";
import {
  ApiResponse,
  CreatePrepServiceInput,
  PrepServiceQueryParams,
  PrepServiceRequest,
  UpdatePrepServiceStatusInput,
} from "@/types/prepService";

export const prepServiceApi = {
  create: async (
    input: CreatePrepServiceInput
  ): Promise<ApiResponse<PrepServiceRequest>> => {
    const formData = new FormData();
    const payload = {
      serviceType: input.serviceType,
      notes: input.notes,
    };
    formData.append("data", JSON.stringify(payload));
    if (input.attachments && input.attachments.length > 0) {
      input.attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }
    const res = await apiClient.post("/prep-services", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getMyRequests: async (
    params?: PrepServiceQueryParams
  ): Promise<
    ApiResponse<{
      data: PrepServiceRequest[];
      meta: { page: number; limit: number; total: number };
    }>
  > => {
    const res = await apiClient.get("/prep-services/my", { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<PrepServiceRequest>> => {
    const res = await apiClient.get(`/prep-services/${id}`);
    return res.data;
  },

  getAll: async (
    params?: PrepServiceQueryParams
  ): Promise<
    ApiResponse<{
      data: PrepServiceRequest[];
      meta: { page: number; limit: number; total: number };
    }>
  > => {
    const res = await apiClient.get("/prep-services", { params });
    return res.data;
  },

  updateStatus: async (
    id: string,
    payload: UpdatePrepServiceStatusInput
  ): Promise<ApiResponse<PrepServiceRequest>> => {
    const res = await apiClient.patch(`/prep-services/${id}/status`, payload);
    return res.data;
  },
};

