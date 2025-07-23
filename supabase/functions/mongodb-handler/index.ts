
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

    const MONGODB_URI = Deno.env.get('MONGO_URI')
    
    if (!MONGODB_URI) {
      console.error('MONGO_URI environment variable not found')
      throw new Error('MongoDB URI not configured')
    }

    console.log('MongoDB URI found, attempting connection...')

    const { action, data } = await req.json()
    console.log('MongoDB handler called with action:', action, 'data:', JSON.stringify(data, null, 2))

    // Connect to MongoDB
    const client = new MongoClient()
    
    try {
      await client.connect(MONGODB_URI)
      console.log('Connected to MongoDB successfully')
      
      const db = client.database("authexa_chat")
      const chatCollection = db.collection("chat_history")

      // Ensure TTL index exists for 1-week expiry
      try {
        await chatCollection.createIndexes({
          indexes: [
            {
              key: { updatedAt: 1 },
              name: "updatedAt_ttl",
              expireAfterSeconds: 604800 // 7 days = 7 * 24 * 60 * 60 seconds
            },
            {
              key: { userId: 1 },
              name: "userId_index"
            }
          ]
        })
        console.log('✅ TTL and userId indexes ensured')
      } catch (indexError) {
        console.log('ℹ️ Indexes may already exist:', indexError.message)
      }

      let result = null

      switch (action) {
        case 'saveChatHistory':
          const { userId, messages } = data
          console.log('Saving chat history for user:', userId, 'messages count:', messages?.length)
          
          if (!userId || !messages) {
            throw new Error('Missing userId or messages in request')
          }

          // Use updateOne with upsert to ensure the document is created or updated
          result = await chatCollection.updateOne(
            { userId: userId },
            { 
              $set: { 
                userId: userId, 
                messages: messages, 
                updatedAt: new Date() 
              } 
            },
            { upsert: true }
          )
          console.log('Save result:', result)
          
          // Verify the save by reading back the data
          const savedDoc = await chatCollection.findOne({ userId: userId })
          console.log('Verification - saved document:', savedDoc ? 'found' : 'not found')
          break

        case 'getChatHistory':
          console.log('Getting chat history for user:', data.userId)
          
          if (!data.userId) {
            throw new Error('Missing userId in request')
          }
          
          const chatHistory = await chatCollection.findOne({ userId: data.userId })
          console.log('Retrieved chat history:', chatHistory ? 'found' : 'not found')
          
          if (chatHistory) {
            console.log('Chat history messages count:', chatHistory.messages?.length || 0)
          }
          
          result = { 
            messages: chatHistory?.messages || [],
            found: !!chatHistory
          }
          break

        default:
          throw new Error(`Unknown action: ${action}`)
      }

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

    } catch (mongoError) {
      console.error('MongoDB operation error:', mongoError)
      throw mongoError
    } finally {
      try {
        await client.close()
        console.log('MongoDB connection closed')
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError)
      }
    }

  } catch (error) {
    console.error('MongoDB handler error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})
