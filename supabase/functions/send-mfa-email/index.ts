
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MFAEmailRequest {
  email: string;
  code: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userName }: MFAEmailRequest = await req.json();

    console.log(`📧 Sending MFA code to: ${email}`);

    // Use the default Resend sender address which is always verified
    const emailResponse = await resend.emails.send({
      from: "Authexa Support <onboarding@resend.dev>",
      to: [email],
      subject: "Your Authexa Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Authexa</h1>
            <p style="color: #64748b; margin: 5px 0 0 0;">Support System</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">Verification Code</h2>
            <p style="color: #475569; margin: 0 0 20px 0;">
              ${userName ? `Hello ${userName},` : 'Hello,'}<br>
              Your verification code for Authexa Support is:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #1e293b; color: white; padding: 15px 30px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; display: inline-block;">
                ${code}
              </div>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2024 Authexa Support System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ MFA email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending MFA email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send MFA email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
