import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { readApiError } from "@/lib/apiClient";
import { prepServiceApi } from "@/services/prepService.api";
import type {
  PrepServiceQueryParams,
  PrepServiceRequest,
} from "@/types/prepService";

export const PREP_SERVICE_KEYS = {
  all: ["prep-services"] as const,
  lists: () => [...PREP_SERVICE_KEYS.all, "my"] as const,
  my: (params?: PrepServiceQueryParams) =>
    [...PREP_SERVICE_KEYS.lists(), params] as const,
  detail: (id: string) => [...PREP_SERVICE_KEYS.all, "detail", id] as const,
};

/** 4xx answers (401, 403, 404…) won't change on a retry. */
function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = readApiError(error).statusCode;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 1;
}

/**
 * Refetches every prep-service list and detail. Call it when an in-app
 * notification such as "Prep request approved" or "Prep request needs
 * changes" arrives.
 */
export function refreshPrepServices(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: PREP_SERVICE_KEYS.all });
}

export function useMyPrepServices(params: PrepServiceQueryParams) {
  return useQuery({
    queryKey: PREP_SERVICE_KEYS.my(params),
    queryFn: () => prepServiceApi.getMyRequests(params),
    placeholderData: keepPreviousData,
    // The admin changes statuses; pick that up when the customer comes back.
    refetchOnWindowFocus: true,
    retry: retryUnlessClientError,
  });
}

export function usePrepServiceDetail(id: string) {
  return useQuery({
    queryKey: PREP_SERVICE_KEYS.detail(id),
    queryFn: () => prepServiceApi.getById(id),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
    retry: retryUnlessClientError,
  });
}

function storeRequest(queryClient: QueryClient, request: PrepServiceRequest) {
  queryClient.setQueryData(PREP_SERVICE_KEYS.detail(request.id), request);
  return queryClient.invalidateQueries({ queryKey: PREP_SERVICE_KEYS.lists() });
}

/** Errors are not toasted here; the form shows them next to the file picker. */
export function useCreatePrepService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => prepServiceApi.create(files),
    onSuccess: (request) => {
      toast.success("Prep request submitted. Our team will review your files.");
      void storeRequest(queryClient, request);
    },
  });
}

export function useResubmitPrepService(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => prepServiceApi.resubmit(id, files),
    onSuccess: (request) => {
      toast.success("Files resubmitted. Your request is back under review.");
      void storeRequest(queryClient, request);
    },
  });
}
