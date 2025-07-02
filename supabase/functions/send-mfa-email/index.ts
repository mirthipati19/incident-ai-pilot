
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
  isWelcome?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userName, isWelcome }: MFAEmailRequest = await req.json();

    console.log(`📧 Sending ${isWelcome ? 'welcome' : 'MFA'} email to: ${email}`);
    console.log(`🔐 Code being sent: ${code}`); // Debug log to ensure code is not undefined

    if (isWelcome) {
      // Send welcome email
      const emailResponse = await resend.emails.send({
        from: "Authexa Support <noreply@selfservice.authexa.me>",
        to: [email],
        subject: "Welcome to Authexa ITSM!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Authexa ITSM!</h1>
              <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.9;">IT Service Management Platform</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">Account Created Successfully!</h2>
              <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
                ${userName ? `Hello ${userName},` : 'Hello,'}<br>
                Your account has been successfully created! You can now sign in to Authexa ITSM and start experiencing the future of IT service management.
              </p>
              
              <div style="background: #e0f2fe; border: 1px solid #81d4fa; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #01579b; font-size: 14px; margin: 0; font-weight: 500;">
                  🎉 Your account is ready to use! Sign in to get started.
                </p>
              </div>
              
              <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0; line-height: 1.5;">
                Experience AI-powered ticket routing, seamless team collaboration, and advanced analytics.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2024 Authexa ITSM. All rights reserved.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 5px 0 0 0;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      });

      console.log("✅ Welcome email sent successfully:", emailResponse);
      return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Validate that code is not undefined
    if (!code || code === 'undefined') {
      console.error("❌ Code is undefined or invalid:", code);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid verification code" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send MFA verification code email
    const emailResponse = await resend.emails.send({
      from: "Authexa Support <noreply@selfservice.authexa.me>",
      to: [email],
      subject: "Your Authexa Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Authexa</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.9;">Support System</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">Security Verification Code</h2>
            <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
              ${userName ? `Hello ${userName},` : 'Hello,'}<br>
              Your verification code for Authexa Support System is:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #1e293b; color: white; padding: 20px 30px; border-radius: 8px; font-size: 36px; font-weight: bold; letter-spacing: 12px; display: inline-block; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 500;">
                ⏰ This code will expire in 10 minutes for your security.
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0; line-height: 1.5;">
              If you didn't request this code, please ignore this email and ensure your account is secure.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2024 Authexa Support System. All rights reserved.
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin: 5px 0 0 0;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ MFA email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
