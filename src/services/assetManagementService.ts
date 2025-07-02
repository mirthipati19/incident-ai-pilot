
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Asset = Tables<"assets">;
export type AssetRelationship = Tables<"asset_relationships">;
export type SoftwareLicense = Tables<"software_licenses">;

export const assetManagementService = {
  // Asset operations
  async getAssets(filters?: { status?: string; category?: string; assigned_to?: string }) {
    let query = supabase
      .from("assets")
      .select("*")
      .order("name");

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.assigned_to) {
      query = query.eq("assigned_to", filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getAsset(id: string) {
    const { data, error } = await supabase
      .from("assets")
      .select(`
        *,
        relationships_as_parent:asset_relationships!parent_asset_id(*),
        relationships_as_child:asset_relationships!child_asset_id(*)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createAsset(asset: TablesInsert<"assets">) {
    const { data, error } = await supabase
      .from("assets")
      .insert(asset)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAsset(id: string, updates: TablesUpdate<"assets">) {
    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAsset(id: string) {
    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // License operations
  async getLicenses() {
    const { data, error } = await supabase
      .from("software_licenses")
      .select("*")
      .order("software_name");

    if (error) throw error;
    return data;
  },

  async createLicense(license: TablesInsert<"software_licenses">) {
    const { data, error } = await supabase
      .from("software_licenses")
      .insert(license)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateLicense(id: string, updates: TablesUpdate<"software_licenses">) {
    const { data, error } = await supabase
      .from("software_licenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Asset relationship operations
  async createRelationship(relationship: TablesInsert<"asset_relationships">) {
    const { data, error } = await supabase
      .from("asset_relationships")
      .insert(relationship)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAssetDependencies(assetId: string) {
    const { data, error } = await supabase
      .from("asset_relationships")
      .select(`
        *,
        parent_asset:parent_asset_id(*),
        child_asset:child_asset_id(*)
      `)
      .or(`parent_asset_id.eq.${assetId},child_asset_id.eq.${assetId}`);

    if (error) throw error;
    return data;
  },

  // License assignment operations
  async assignLicenseToAsset(assetId: string, licenseId: string, assignedBy: string) {
    const { data, error } = await supabase
      .from("asset_license_assignments")
      .insert({
        asset_id: assetId,
        license_id: licenseId,
        assigned_by: assignedBy
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update license usage count
    const { data: license } = await supabase
      .from("software_licenses")
      .select("used_licenses")
      .eq("id", licenseId)
      .single();

    if (license) {
      await supabase
        .from("software_licenses")
        .update({ used_licenses: (license.used_licenses || 0) + 1 })
        .eq("id", licenseId);
    }

    return data;
  }
};
