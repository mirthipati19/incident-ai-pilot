
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  domain?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const createOrganization = async (
  name: string, 
  logoUrl?: string, 
  domain?: string
): Promise<{ success: boolean; data?: Organization; error?: string }> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        logo_url: logoUrl,
        domain,
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Organization creation error:', error);
      return { success: false, error: error.message };
    }

    // Auto-assign the creator to this organization
    await supabase
      .from('users')
      .update({ organization_id: data.id })
      .eq('id', user.user.id);

    console.log('✅ Organization created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('💥 Organization creation error:', error);
    return { success: false, error: 'Failed to create organization' };
  }
};

export const getOrganizationByEmail = async (email: string): Promise<{ organization?: Organization; error?: string }> => {
  try {
    const domain = email.split('@')[1];
    
    if (!domain) {
      return { error: 'Invalid email format' };
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('domain', domain)
      .maybeSingle();

    if (error) {
      console.error('❌ Organization lookup error:', error);
      return { error: error.message };
    }

    return { organization: data || undefined };
  } catch (error) {
    console.error('💥 Organization lookup error:', error);
    return { error: 'Failed to lookup organization' };
  }
};

export const getUserOrganization = async (userId: string): Promise<{ organization?: Organization; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        organization_id,
        organizations!inner(*)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ User organization lookup error:', error);
      return { error: error.message };
    }

    return { organization: data?.organizations };
  } catch (error) {
    console.error('💥 User organization lookup error:', error);
    return { error: 'Failed to get user organization' };
  }
};
