
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, name, password, organizationId, secretKey } = await req.json();

    // Verify secret key for additional security
    const expectedSecretKey = Deno.env.get('ADMIN_CREATION_SECRET');
    if (!expectedSecretKey || secretKey !== expectedSecretKey) {
      console.error('❌ Invalid secret key provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid secret key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, name, password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 Creating admin user:', email);

    // Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error('❌ Auth user creation error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique user ID
    const userId = Math.floor(100000 + Math.random() * 100000).toString();

    // Add user to users table
    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.user.id,
      user_id: userId,
      email,
      name,
      organization_id: organizationId || null,
      password_hash: 'handled_by_supabase'
    });

    if (insertError) {
      console.error('❌ User table insert error:', insertError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add to admin_users table
    const { error: adminError } = await supabase.from('admin_users').insert({
      user_id: authUser.user.id,
      role: 'admin',
      permissions: ['view_tickets', 'manage_users', 'view_stats', 'full_admin']
    });

    if (adminError) {
      console.error('❌ Admin user insert error:', adminError);
      // Don't fail if admin_users insert fails, just log it
      console.warn('⚠️ Admin user created but admin_users record failed');
    }

    console.log('✅ Admin user created successfully:', authUser.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authUser.user.id,
        email: authUser.user.email,
        message: 'Admin user created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Admin creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
