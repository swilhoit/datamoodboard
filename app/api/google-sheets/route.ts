import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Get Google Sheets client with service account authentication
async function getGoogleSheetsClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  
  if (!credentials) {
    throw new Error('Google service account credentials not configured')
  }

  try {
    const serviceAccount = JSON.parse(credentials)
    
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    return google.sheets({ version: 'v4', auth })
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error)
    throw new Error('Invalid service account credentials')
  }
}

// Helper function to detect data types
function detectType(values: any[]): string {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  
  if (nonNullValues.length === 0) return 'VARCHAR(255)'
  
  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => !isNaN(Number(v)))
  if (allNumbers) {
    const hasDecimals = nonNullValues.some(v => String(v).includes('.'))
    return hasDecimals ? 'DECIMAL(10,2)' : 'INTEGER'
  }
  
  // Check if values look like dates
  const datePattern = /^\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/
  const allDates = nonNullValues.every(v => datePattern.test(String(v)))
  if (allDates) return 'DATE'
  
  // Check if values are boolean-like
  const boolValues = ['true', 'false', 'yes', 'no', '0', '1']
  const allBooleans = nonNullValues.every(v => 
    boolValues.includes(String(v).toLowerCase())
  )
  if (allBooleans) return 'BOOLEAN'
  
  // Default to string
  return 'VARCHAR(255)'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, spreadsheetId, range } = body

    const sheets = await getGoogleSheetsClient()

    if (action === 'fetchData') {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: range || 'A:Z',
        })

        const values = response.data.values || []
        
        if (values.length === 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'No data found in the specified range' 
          })
        }

        // Use first row as headers
        const headers = values[0]
        const rows = values.slice(1)

        // Create schema with type detection
        const schema = headers.map((header: string, index: number) => {
          const columnValues = rows.map((row: any[]) => row[index])
          return {
            name: header,
            type: detectType(columnValues),
          }
        })

        // Transform rows into objects
        const tableData = rows.map((row: any[]) => {
          const obj: any = {}
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index] || null
          })
          return obj
        })

        return NextResponse.json({ 
          success: true, 
          schema,
          data: tableData,
          headers,
          rowCount: rows.length
        })
      } catch (error: any) {
        console.error('Error fetching sheet data:', error)
        
        // Provide helpful error messages
        if (error.code === 403) {
          return NextResponse.json({ 
            success: false, 
            error: 'Permission denied. Please make sure you have shared the spreadsheet with our service account email.' 
          })
        } else if (error.code === 404) {
          return NextResponse.json({ 
            success: false, 
            error: 'Spreadsheet not found. Please check the URL and try again.' 
          })
        }
        
        throw error
      }
    }

    if (action === 'listSheets') {
      try {
        const response = await sheets.spreadsheets.get({
          spreadsheetId,
        })

        const sheetsData = response.data.sheets?.map((sheet: any) => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          rowCount: sheet.properties.gridProperties?.rowCount,
          columnCount: sheet.properties.gridProperties?.columnCount,
        })) || []

        return NextResponse.json({ 
          success: true, 
          sheets: sheetsData,
          spreadsheetTitle: response.data.properties?.title
        })
      } catch (error: any) {
        console.error('Error listing sheets:', error)
        
        // Provide helpful error messages
        if (error.code === 403) {
          return NextResponse.json({ 
            success: false, 
            error: 'Permission denied. Please share the spreadsheet with our service account email and try again.' 
          })
        } else if (error.code === 404) {
          return NextResponse.json({ 
            success: false, 
            error: 'Spreadsheet not found. Please check the URL and make sure it\'s correct.' 
          })
        }
        
        throw error
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    })
  } catch (error: any) {
    console.error('Google Sheets API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process request' 
    }, { status: 500 })
  }
}