import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, email, password, organizationName, adminName } = await req.json();

    if (action === 'register') {
      // Create organization
      const { data: orgData, error: orgError } = await supabaseClient
        .from('organizations')
        .insert({
          name: organizationName,
          domain: email.split('@')[1]
        })
        .select()
        .single();

      if (orgError) {
        return new Response(JSON.stringify({ error: 'Failed to create organization' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: adminName, role: 'admin' }
      });

      if (authError) {
        return new Response(JSON.stringify({ error: 'Failed to create admin user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create admin user record
      const { error: adminError } = await supabaseClient
        .from('admin_users')
        .insert({
          user_id: authData.user.id,
          organization_id: orgData.id,
          role: 'admin',
          permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin'],
          is_email_verified: true
        });

      if (adminError) {
        return new Response(JSON.stringify({ error: 'Failed to create admin record' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'login') {
      // Authenticate user
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get admin details
      const { data: adminData, error: adminError } = await supabaseClient
        .from('admin_users')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', authData.user.id)
        .single();

      if (adminError || !adminData) {
        return new Response(JSON.stringify({ error: 'Admin user not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .insert({
          admin_user_id: adminData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        user: adminData,
        session: sessionData,
        auth: authData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'getOrganization') {
      const domain = email.split('@')[1];
      const { data: orgData } = await supabaseClient
        .from('organizations')
        .select('*')
        .eq('domain', domain)
        .single();

      return new Response(JSON.stringify({ organization: orgData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});