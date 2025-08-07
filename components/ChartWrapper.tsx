'use client'

import { memo, useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MultiLibraryChart = dynamic(() => import('./charts/MultiLibraryChart'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded">
      <div className="animate-pulse text-gray-400">Loading chart...</div>
    </div>
  )
})

interface ChartWrapperProps {
  data: any[]
  type: string
  library?: string
  config?: any
  width?: number | string
  height?: number | string
}

// Debounce hook for chart updates
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function ChartWrapper({ 
  data, 
  type, 
  library = 'recharts', 
  config = {}, 
  width = '100%', 
  height = 300 
}: ChartWrapperProps) {
  // Debounce data changes to prevent rapid re-renders
  const debouncedData = useDebounce(data, 200)
  const debouncedConfig = useDebounce(config, 200)
  
  // Track if component is mounted
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="animate-pulse text-gray-400">Initializing...</div>
      </div>
    )
  }

  return (
    <MultiLibraryChart
      data={debouncedData}
      type={type as any}
      library={library as any}
      config={debouncedConfig}
      width={width}
      height={height}
    />
  )
}

// Memoize with custom comparison
export default memo(ChartWrapper, (prevProps, nextProps) => {
  // Only re-render if significant props change
  const dataChanged = JSON.stringify(prevProps.data) !== JSON.stringify(nextProps.data)
  const typeChanged = prevProps.type !== nextProps.type
  const libraryChanged = prevProps.library !== nextProps.library
  const configChanged = JSON.stringify(prevProps.config) !== JSON.stringify(nextProps.config)
  const sizeChanged = prevProps.width !== nextProps.width || prevProps.height !== nextProps.height
  
  // Return true if props are equal (no re-render needed)
  return !(dataChanged || typeChanged || libraryChanged || configChanged || sizeChanged)
})