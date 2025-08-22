import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Mock Google Ads OAuth flow
  // In production, this would redirect to Google's OAuth endpoint
  // For now, we'll just redirect back with success status to load sample data
  
  const redirectUrl = new URL('/', request.url)
  redirectUrl.searchParams.set('integration', 'google-ads')
  redirectUrl.searchParams.set('status', 'success')
  
  return NextResponse.redirect(redirectUrl)
}