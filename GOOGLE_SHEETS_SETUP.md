# Google Sheets Integration Setup

This application uses a service account for Google Sheets integration, providing a simple "share and import" workflow for users.

## How It Works

1. **Share with Service Account**: Users share their Google Sheet with our service account email
2. **Paste URL**: Users paste the sheet URL in the app
3. **Import Data**: The app fetches and imports the data

## User Instructions

### Step 1: Share Your Google Sheet
1. Open your Google Sheet
2. Click the "Share" button (top right)
3. Add this email: `datamoodboard@data-moodboard-20250807.iam.gserviceaccount.com`
4. Set permission to "Viewer"
5. Click "Send"

### Step 2: Import in the App
1. Click "Connect Data Source" → "Google Sheets"
2. Follow the on-screen instructions
3. Paste your Google Sheet URL
4. Select the sheet and range to import
5. Click "Import Data"

## Developer Setup

### Prerequisites
- Google Cloud Project with Sheets API enabled
- Service Account with appropriate permissions

### Configuration

1. **Service Account Setup**:
   - Create a service account in Google Cloud Console
   - Download the JSON key file
   - Enable Google Sheets API for your project

2. **Environment Variables**:
   ```env
   # Service account email (shown to users)
   NEXT_PUBLIC_SHEETS_SERVICE_EMAIL=your-service-account@project.iam.gserviceaccount.com
   
   # Service account credentials (keep secure)
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```

3. **Required Permissions**:
   - The service account needs "Viewer" access to any sheets it will read
   - Users must manually share their sheets with the service account

## Security Notes

- Service account credentials are kept server-side only
- The API route validates all requests
- Read-only access ensures data safety
- No OAuth tokens are stored

## Troubleshooting

### "Permission Denied" Error
- Ensure the sheet is shared with the service account email
- Check that the service account email in .env matches the one shown to users

### "Spreadsheet Not Found" Error
- Verify the URL is correct
- Ensure the spreadsheet hasn't been deleted or moved

### "No Data Found" Error
- Check that the specified range contains data
- Verify the sheet name is correct

## Data Type Detection

The integration automatically detects column data types:
- INTEGER: Whole numbers
- DECIMAL: Numbers with decimals
- DATE: Date values
- BOOLEAN: True/false values
- VARCHAR: Text/string values

## API Endpoints

### POST /api/google-sheets

Actions:
- `listSheets`: Get all sheets in a spreadsheet
- `fetchData`: Fetch data from a specific sheet/range

Example:
```json
{
  "action": "fetchData",
  "spreadsheetId": "1abc...",
  "range": "Sheet1!A:Z"
}
```