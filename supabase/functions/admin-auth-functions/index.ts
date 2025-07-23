
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
        // Get admin user from auth.users first, then check admin_users table
        const { data: authUser } = await supabaseClient.auth.admin.getUserByEmail(params.email);
        if (!authUser.user) {
          result = { data: null, error: { message: 'User not found' } };
          break;
        }

        // Verify password using Supabase auth
        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
          email: params.email,
          password: params.password
        });

        if (loginError) {
          result = { data: null, error: { message: 'Invalid credentials' } };
          break;
        }

        // Get admin user details with organization
        result = await supabaseClient
          .from('admin_users')
          .select(`
            *,
            organizations (*)
          `)
          .eq('user_id', authUser.user.id)
          .single();

        if (result.data) {
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
        }
        break;

      case 'forgotPassword':
        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + 1);

        result = await supabaseClient
          .from('admin_password_resets')
          .insert({
            email: params.email,
            token: resetToken,
            expires_at: resetExpiry.toISOString()
          })
          .select()
          .single();
        break;

      case 'resetPassword':
        // Verify reset token and update password
        const { data: resetData } = await supabaseClient
          .from('admin_password_resets')
          .select('*')
          .eq('token', params.token)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (!resetData) {
          result = { data: null, error: { message: 'Invalid or expired reset token' } };
          break;
        }

        // Update password in auth.users
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          params.userId,
          { password: params.newPassword }
        );

        if (updateError) {
          result = { data: null, error: { message: 'Failed to update password' } };
          break;
        }

        // Mark token as used
        await supabaseClient
          .from('admin_password_resets')
          .update({ used: true })
          .eq('id', resetData.id);

        result = { data: { success: true }, error: null };
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
