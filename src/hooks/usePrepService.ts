import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prepServiceApi } from "@/services/prepService.api";
import {
  CreatePrepServiceInput,
  PrepServiceQueryParams,
  PrepServiceRequest,
  UpdatePrepServiceStatusInput,
} from "@/types/prepService";
import { toast } from "sonner";

export const PREP_SERVICE_KEYS = {
  all: ["prep-services"] as const,
  my: (params?: PrepServiceQueryParams) =>
    [...PREP_SERVICE_KEYS.all, "my", params] as const,
  detail: (id: string) => [...PREP_SERVICE_KEYS.all, "detail", id] as const,
  adminList: (params?: PrepServiceQueryParams) =>
    [...PREP_SERVICE_KEYS.all, "admin", params] as const,
};

export function useMyPrepServices(params?: PrepServiceQueryParams) {
  return useQuery({
    queryKey: PREP_SERVICE_KEYS.my(params),
    queryFn: () => prepServiceApi.getMyRequests(params),
    select: (res) => {
      // Backend may return res.data as an array or { data: [...], meta: {...} }
      const body = res?.data as unknown;
      if (Array.isArray(body)) {
        return {
          data: body as PrepServiceRequest[],
          meta: res?.meta ?? { page: 1, limit: 10, total: body.length },
        };
      }
      if (body && typeof body === "object" && "data" in body) {
        const nested = body as {
          data: PrepServiceRequest[];
          meta?: { page: number; limit: number; total: number };
        };
        return {
          data: Array.isArray(nested.data) ? nested.data : [],
          meta: nested.meta ?? res?.meta ?? { page: 1, limit: 10, total: 0 },
        };
      }
      return {
        data: [] as PrepServiceRequest[],
        meta: res?.meta ?? { page: 1, limit: 10, total: 0 },
      };
    },
  });
}

export function usePrepServiceDetail(id: string) {
  return useQuery({
    queryKey: PREP_SERVICE_KEYS.detail(id),
    queryFn: () => prepServiceApi.getById(id),
    select: (res) => res.data,
    enabled: Boolean(id),
  });
}

export function useCreatePrepService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePrepServiceInput) => prepServiceApi.create(input),
    onSuccess: () => {
      toast.success("Prep service request submitted successfully");
      queryClient.invalidateQueries({ queryKey: PREP_SERVICE_KEYS.all });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to submit prep service request"
      );
    },
  });
}

export function useUpdatePrepServiceStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePrepServiceStatusInput) =>
      prepServiceApi.updateStatus(id, payload),
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: PREP_SERVICE_KEYS.all });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update status"
      );
    },
  });
}

