"use client"

import posthog from 'posthog-js'
import { env } from './env'

let posthogInitialized = false

export function initPosthog(): void {
  if (posthogInitialized) return
  const apiKey = env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return
  posthog.init(apiKey, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
  })
  posthogInitialized = true
}

export function track(eventName: string, properties?: Record<string, unknown>): void {
  if (!posthogInitialized) return
  posthog.capture(eventName, properties)
}

export function identify(userId: string, properties?: Record<string, unknown>): void {
  if (!posthogInitialized) return
  posthog.identify(userId, properties)
}

export function resetIdentity(): void {
  if (!posthogInitialized) return
  posthog.reset()
}


