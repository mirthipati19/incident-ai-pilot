
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type ServiceCatalog = Tables<"service_catalog">;
export type ServiceRequest = Tables<"service_requests">;
export type ApprovalWorkflow = Tables<"approval_workflows">;
export type SLAPolicy = Tables<"sla_policies">;

export const serviceCatalogService = {
  // Service Catalog operations
  async getServiceCatalog() {
    const { data, error } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) throw error;
    return data;
  },

  async createServiceCatalogItem(item: TablesInsert<"service_catalog">) {
    const { data, error } = await supabase
      .from("service_catalog")
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateServiceCatalogItem(id: string, updates: TablesUpdate<"service_catalog">) {
    const { data, error } = await supabase
      .from("service_catalog")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Service Request operations
  async getServiceRequests(userId?: string) {
    let query = supabase
      .from("service_requests")
      .select(`
        *,
        service_catalog:service_catalog_id (
          name,
          category,
          icon
        )
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createServiceRequest(request: TablesInsert<"service_requests">) {
    const { data, error } = await supabase
      .from("service_requests")
      .insert(request)
      .select(`
        *,
        service_catalog:service_catalog_id (
          name,
          category,
          icon
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateServiceRequest(id: string, updates: TablesUpdate<"service_requests">) {
    const { data, error } = await supabase
      .from("service_requests")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        service_catalog:service_catalog_id (
          name,
          category,
          icon
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // SLA Policy operations
  async getSLAPolicies() {
    const { data, error } = await supabase
      .from("sla_policies")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) throw error;
    return data;
  },

  async createSLAPolicy(policy: TablesInsert<"sla_policies">) {
    const { data, error } = await supabase
      .from("sla_policies")
      .insert(policy)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
