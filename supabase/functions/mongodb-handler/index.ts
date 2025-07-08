
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const MONGODB_URI = Deno.env.get('MONGODB_URI')
    
    if (!MONGODB_URI) {
      throw new Error('MongoDB URI not configured')
    }

    const { action, data } = await req.json()

    // Connect to MongoDB
    const client = new MongoClient()
    await client.connect(MONGODB_URI)
    
    const db = client.database("authexa_chat")
    const chatCollection = db.collection("chat_history")

    let result = null

    switch (action) {
      case 'saveChatHistory':
        const { userId, messages } = data
        result = await chatCollection.replaceOne(
          { userId },
          { userId, messages, updatedAt: new Date() },
          { upsert: true }
        )
        break

      case 'getChatHistory':
        const chatHistory = await chatCollection.findOne({ userId: data.userId })
        result = { messages: chatHistory?.messages || [] }
        break

      default:
        result = { message: 'Unknown action' }
    }

    await client.close()

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    )
  }
})
