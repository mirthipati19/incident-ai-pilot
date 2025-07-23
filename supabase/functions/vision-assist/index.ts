import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sessionId, screenshot, intent, currentStep } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'analyzeScreen') {
      console.log('Analyzing screen for session:', sessionId);
      
      if (!openAIApiKey) {
        return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Analyze screenshot with GPT-4 Vision
      const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a computer vision assistant that helps users navigate software interfaces. 
              Analyze the screenshot and provide step-by-step guidance based on the user's intent.
              
              Return a JSON response with:
              - instruction: Clear step-by-step instruction for the user
              - uiElements: Array of detected UI elements with coordinates, text, and element type
              - confidence: Your confidence level (0-1) in the analysis
              - nextAction: Suggested next action type (click, type, scroll, etc.)
              - isComplete: Whether the task appears to be complete
              
              Focus on identifying clickable buttons, input fields, links, and navigation elements.
              Provide precise coordinates when possible.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `User intent: ${intent}\nCurrent step: ${currentStep}\n\nPlease analyze this screenshot and provide the next instruction.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: screenshot
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        }),
      });

      if (!visionResponse.ok) {
        console.error('OpenAI API error:', await visionResponse.text());
        return new Response(JSON.stringify({ error: 'Failed to analyze screenshot' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const visionResult = await visionResponse.json();
      let analysis;
      
      try {
        // Try to parse the response as JSON
        analysis = JSON.parse(visionResult.choices[0].message.content);
      } catch {
        // If not JSON, create a structured response
        analysis = {
          instruction: visionResult.choices[0].message.content,
          uiElements: [],
          confidence: 0.8,
          nextAction: 'click',
          isComplete: false
        };
      }

      // Save the step to database
      const { error: stepError } = await supabaseClient
        .from('vision_session_steps')
        .insert({
          session_id: sessionId,
          step_number: currentStep,
          instruction: analysis.instruction,
          screenshot_url: screenshot,
          ai_analysis: analysis,
          ui_elements: analysis.uiElements || [],
          status: 'in_progress'
        });

      if (stepError) {
        console.error('Database error:', stepError);
      }

      // Add assistant message to chat
      const { error: messageError } = await supabaseClient
        .from('vision_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: analysis.instruction,
          message_type: 'instruction',
          metadata: { analysis, step: currentStep }
        });

      if (messageError) {
        console.error('Message save error:', messageError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        analysis,
        instruction: analysis.instruction,
        uiElements: analysis.uiElements || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'createSession') {
      console.log('Creating vision session for intent:', intent);
      
      const { data: session, error } = await supabaseClient
        .from('vision_sessions')
        .insert({
          user_id: req.headers.get('user-id'),
          title: intent,
          intent_description: intent,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add initial system message
      await supabaseClient
        .from('vision_chat_messages')
        .insert({
          session_id: session.id,
          role: 'system',
          content: `VisionAssist session started for: ${intent}`,
          message_type: 'text'
        });

      return new Response(JSON.stringify({ 
        success: true, 
        session
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateStep') {
      const { stepId, status, userAction } = await req.json();
      
      const { error } = await supabaseClient
        .from('vision_session_steps')
        .update({
          status,
          user_action: userAction,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', stepId);

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to update step' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vision-assist function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});