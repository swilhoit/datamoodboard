import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Mock Stripe OAuth flow
  // In production, this would redirect to Stripe's OAuth endpoint
  // For now, we'll just redirect back with success status to load sample data
  
  const redirectUrl = new URL('/', request.url)
  redirectUrl.searchParams.set('integration', 'stripe')
  redirectUrl.searchParams.set('status', 'connected')
  
  return NextResponse.redirect(redirectUrl)
}