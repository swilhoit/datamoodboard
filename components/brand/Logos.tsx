"use client"

import React from "react"
import {
  siShopify,
  siGooglesheets,
  siStripe,
  siGoogleads,
} from "simple-icons/icons"

type BrandLogoProps = {
  size?: number
  className?: string
  title?: string
}

function SvgFromSimpleIcon({ icon, size = 18, className, title }: { icon: { path: string; title: string; hex: string }; size?: number; className?: string; title?: string }) {
  const ariaLabel = title || icon.title
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{ariaLabel}</title>
      <path d={icon.path} fill="currentColor" />
    </svg>
  )
}

export function ShopifyLogo(props: BrandLogoProps) {
  return <SvgFromSimpleIcon icon={siShopify} {...props} />
}

export function GoogleSheetsLogo(props: BrandLogoProps) {
  return <SvgFromSimpleIcon icon={siGooglesheets} {...props} />
}

export function StripeLogo(props: BrandLogoProps) {
  return <SvgFromSimpleIcon icon={siStripe} {...props} />
}

export function GoogleAdsLogo(props: BrandLogoProps) {
  return <SvgFromSimpleIcon icon={siGoogleads} {...props} />
}

export type { BrandLogoProps }


