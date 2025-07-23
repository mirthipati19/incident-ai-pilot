
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
        const { data: orgData, error: orgError } = await supabaseClient
          .from('organizations')
          .select('id, name, domain, logo_url, created_at, updated_at')
          .eq('domain', params.domain)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        result = { data: orgData, error: orgError };
        break;

      case 'createOrganization':
        result = await supabaseClient
          .from('organizations')
          .insert({
            name: params.name,
            domain: params.domain,
            logo_url: params.logoUrl
          })
          .select()
          .single();
        break;

      case 'loginAdmin':
        try {
          console.log('Login attempt for:', params.email);
          
          // First, let's verify the admin user exists
          const { data: adminCheckData, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select(`
              *,
              organizations (*)
            `)
            .eq('user_id', '666f8e41-9c4c-44fb-80ff-a5ebeee540a9')
            .single();

          if (adminCheckError || !adminCheckData) {
            console.log('Admin user check failed:', adminCheckError);
            result = { data: null, error: { message: 'Admin user not found in database' } };
            break;
          }

          console.log('Admin user found:', adminCheckData.id, 'Organization:', adminCheckData.organizations?.name);

          // Try to authenticate with Supabase auth
          const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: params.email,
            password: params.password
          });

          if (authError) {
            console.log('Auth error details:', JSON.stringify(authError));
            result = { data: null, error: { message: 'Invalid email or password. Please check your credentials.' } };
            break;
          }

          if (!authData.user) {
            console.log('No user data returned from auth');
            result = { data: null, error: { message: 'Authentication failed' } };
            break;
          }

          console.log('Auth successful for user:', authData.user.id);

          // Verify this matches our admin user
          if (authData.user.id !== adminCheckData.user_id) {
            console.log('User ID mismatch:', authData.user.id, 'vs', adminCheckData.user_id);
            result = { data: null, error: { message: 'User account not linked to admin role' } };
            break;
          }

          // Create session
          const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          const { data: sessionData, error: sessionError } = await supabaseClient
            .from('admin_sessions')
            .insert({
              admin_user_id: adminCheckData.id,
              session_token: sessionToken,
              expires_at: expiresAt.toISOString(),
              is_active: true
            })
            .select()
            .single();

          if (sessionError) {
            console.log('Session creation error:', sessionError);
            result = { data: null, error: { message: 'Failed to create session' } };
            break;
          }

          console.log('Login successful, session created');

          result = {
            data: {
              user: adminCheckData,
              session: sessionData
            },
            error: null
          };
        } catch (error) {
          console.log('Login error:', error);
          result = { data: null, error: { message: 'Login failed: ' + error.message } };
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
