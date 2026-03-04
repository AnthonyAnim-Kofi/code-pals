/**
 * useShopItems – Hooks for fetching and managing admin-configurable shop items.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: number;
  currency: string;
  color: string;
  action_type: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function useShopItems() {
  return useQuery({
    queryKey: ["shop-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as ShopItem[];
    },
  });
}

export function useCreateShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<ShopItem, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("shop_items").insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
    },
  });
}

export function useUpdateShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopItem> & { id: string }) => {
      const { error } = await supabase
        .from("shop_items")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
    },
  });
}

export function useDeleteShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shop_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
    },
  });
}
