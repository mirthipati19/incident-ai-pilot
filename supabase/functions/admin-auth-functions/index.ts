
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
          
          // First try to authenticate with Supabase auth
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

          // Get admin user details with organization
          const { data: adminUserData, error: adminError } = await supabaseClient
            .from('admin_users')
            .select(`
              *,
              organizations (*)
            `)
            .eq('user_id', authData.user.id)
            .single();

          if (adminError || !adminUserData) {
            console.log('Admin user not found:', adminError);
            result = { data: null, error: { message: 'Admin user not found. Please contact support.' } };
            break;
          }

          console.log('Admin user found:', adminUserData.id, 'Organization:', adminUserData.organizations?.name);

          // Create session
          const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          const { data: sessionData, error: sessionError } = await supabaseClient
            .from('admin_sessions')
            .insert({
              admin_user_id: adminUserData.id,
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
              user: adminUserData,
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
        // Use Supabase's built-in password reset
        const { data: resetData, error: resetError } = await supabaseClient.auth.resetPasswordForEmail(
          params.email,
          {
            redirectTo: `${params.redirectUrl || 'https://id-preview--2c9c9049-b133-49cb-98a4-54224d43cb10.lovable.app'}/admin/reset-password`
          }
        );

        if (resetError) {
          result = { data: null, error: { message: resetError.message } };
        } else {
          result = { data: { success: true, message: 'Password reset email sent' }, error: null };
        }
        break;
      
      case 'resetPasswordDirect':
        // Direct password reset for admin support (requires email verification)
        try {
          // Find user by email
          const { data: { users }, error: findError } = await supabaseClient.auth.admin.listUsers();
          const targetUser = users?.find(u => u.email === params.email);
          
          if (!targetUser) {
            result = { data: null, error: { message: 'User not found' } };
            break;
          }

          // Update password directly
          const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
            targetUser.id,
            { password: params.newPassword }
          );

          if (updateError) {
            result = { data: null, error: { message: 'Failed to update password: ' + updateError.message } };
          } else {
            result = { data: { success: true, message: 'Password updated successfully' }, error: null };
          }
        } catch (error) {
          result = { data: null, error: { message: 'Password reset failed: ' + error.message } };
        }
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
