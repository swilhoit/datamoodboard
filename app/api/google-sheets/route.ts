import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, spreadsheetId, range, accessToken } = await request.json()

    if (action === 'fetchData') {
      // Fetch data from Google Sheets using the provided spreadsheet ID and range
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform the data into a table format
      const values = data.values || []
      if (values.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No data found in the specified range' 
        })
      }

      // Use first row as headers
      const headers = values[0]
      const rows = values.slice(1)

      // Create schema from headers
      const schema = headers.map((header: string) => ({
        name: header,
        type: 'VARCHAR(255)', // Default type, could be enhanced with type detection
      }))

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
    }

    if (action === 'listSheets') {
      // List all sheets in a spreadsheet
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch spreadsheet info: ${response.statusText}`)
      }

      const data = await response.json()
      const sheets = data.sheets?.map((sheet: any) => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
        rowCount: sheet.properties.gridProperties?.rowCount,
        columnCount: sheet.properties.gridProperties?.columnCount,
      })) || []

      return NextResponse.json({ 
        success: true, 
        sheets,
        spreadsheetTitle: data.properties?.title
      })
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