import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/utils/api";

export const useProductMixturesQuery = () => {
  return useQuery({
    queryKey: ["product-mixtures"],
    queryFn: async () => {
      const data = await api.get<any[]>("/product-mixtures");
      return data;
    },
  });
};

export const useProductMixtureDetailQuery = (id: number | string) => {
  return useQuery({
    queryKey: ["product-mixtures", id],
    queryFn: async () => {
      const data = await api.get<any>(`/product-mixtures/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateProductMixtureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await api.postRaw<any>("/product-mixtures", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-mixtures"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};
