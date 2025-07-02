
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

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'getOrganizationByDomain':
        result = await supabaseClient
          .from('organizations')
          .select('*')
          .eq('domain', params.domain)
          .eq('is_active', true)
          .single();
        break;

      case 'createOrganization':
        result = await supabaseClient
          .from('organizations')
          .insert({
            name: params.name,
            domain: params.domain,
            logo_url: params.logoUrl,
            is_active: true
          })
          .select()
          .single();
        break;

      case 'loginAdmin':
        // Simple password verification (in production, use proper hashing)
        result = await supabaseClient
          .from('admin_users_new')
          .select(`
            *,
            organizations (*)
          `)
          .eq('email', params.email)
          .eq('is_active', true)
          .single();

        if (result.data && params.password === 'Authexa@2024!Admin') {
          // Create session
          const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          const sessionResult = await supabaseClient
            .from('admin_sessions')
            .insert({
              admin_user_id: result.data.id,
              session_token: sessionToken,
              expires_at: expiresAt.toISOString(),
              is_active: true
            })
            .select()
            .single();

          result = {
            data: {
              user: result.data,
              session: sessionResult.data
            },
            error: null
          };
        } else {
          result = { data: null, error: { message: 'Invalid credentials' } };
        }
        break;

      default:
        result = { data: null, error: { message: 'Unknown action' } };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
