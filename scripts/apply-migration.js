const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function applyMigration() {
  try {
    console.log('📦 Applying billing migration to Supabase...')
    
    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'apply-billing-migration.sql'),
      'utf8'
    )
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).single()
    
    if (error) {
      // Try direct execution as fallback
      console.log('⚠️  Direct RPC failed, opening instructions instead...')
      console.log('\n' + '='.repeat(60))
      console.log('📝 Please run this migration manually:')
      console.log('='.repeat(60))
      console.log('\n1. Go to: https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/sql/new')
      console.log('2. Copy and paste the contents of: scripts/apply-billing-migration.sql')
      console.log('3. Click "Run" to execute the migration')
      console.log('\n' + '='.repeat(60))
      return
    }
    
    console.log('✅ Migration applied successfully!')
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    console.log('\n📝 Please apply the migration manually at:')
    console.log('https://supabase.com/dashboard/project/cgqqttkxvudnncavvuky/sql/new')
  }
}

applyMigration()