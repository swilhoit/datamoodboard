'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StatusState {
  clientCreated?: string
  session?: string
  database?: string
  url?: string
  anonKey?: string
  error?: string
  envVars?: {
    url?: string
    key?: string
    keyFormat?: string
  }
}

export default function TestSupabase() {
  const [status, setStatus] = useState<StatusState>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()
        
        // Test 1: Check if client is created
        setStatus((prev: StatusState) => ({ ...prev, clientCreated: '✅ Client created' }))
        
        // Test 2: Try to get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          setStatus((prev: StatusState) => ({ ...prev, session: `❌ Session error: ${sessionError.message}` }))
        } else {
          setStatus((prev: StatusState) => ({ ...prev, session: session ? '✅ Session active' : '⚠️ No session (not logged in)' }))
        }
        
        // Test 3: Try to fetch from a public table (will fail if schema not set up)
        const { error: fetchError } = await supabase
          .from('profiles')
          .select('count(*)', { count: 'exact', head: true })
        
        if (fetchError) {
          if (fetchError.message.includes('relation') || fetchError.message.includes('does not exist')) {
            setStatus((prev: StatusState) => ({ ...prev, database: '⚠️ Database schema not yet created (run schema.sql)' }))
          } else if (fetchError.message.includes('JWT')) {
            setStatus((prev: StatusState) => ({ ...prev, database: '❌ Invalid API key format' }))
          } else {
            setStatus((prev: StatusState) => ({ ...prev, database: `❌ Database error: ${fetchError.message}` }))
          }
        } else {
          setStatus((prev: StatusState) => ({ ...prev, database: '✅ Database connected' }))
        }
        
        // Test 4: Check environment variables
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        setStatus((prev: StatusState) => ({ 
          ...prev, 
          envVars: {
            url: url ? `✅ URL configured: ${url}` : '❌ URL missing',
            key: key ? `✅ Key configured (${key.slice(0, 20)}...)` : '❌ Key missing',
            keyFormat: key?.startsWith('eyJ') ? '✅ Key format looks correct (JWT)' : '⚠️ Key format unusual (expected JWT starting with eyJ)'
          }
        }))
        
      } catch (error: any) {
        setStatus({ error: `❌ Unexpected error: ${error.message}` })
      } finally {
        setLoading(false)
      }
    }
    
    testConnection()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      {loading ? (
        <p>Testing connection...</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Environment Variables:</h2>
            <div className="space-y-1 text-sm font-mono">
              <p>{status.envVars?.url}</p>
              <p>{status.envVars?.key}</p>
              <p>{status.envVars?.keyFormat}</p>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Connection Status:</h2>
            <div className="space-y-1 text-sm font-mono">
              <p>{status.clientCreated}</p>
              <p>{status.session}</p>
              <p>{status.database}</p>
            </div>
          </div>
          
          {status.error && (
            <div className="bg-red-100 p-4 rounded-lg">
              <p className="text-red-700">{status.error}</p>
            </div>
          )}
          
          <div className="bg-blue-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Next Steps:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to your Supabase dashboard → Settings → API</li>
              <li>Find the "anon public" key (should start with "eyJ")</li>
              <li>Replace the current key in .env.local</li>
              <li>Run the schema.sql in SQL Editor</li>
              <li>Restart the app</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}