'use client'

import { useEffect, useRef, useState } from 'react'

interface ConnectionLinesProps {
  connections: any[]
  tables: any[]
  nodes?: any[]
  zoom: number
  onConnectionClick?: (id: string) => void
  onDeleteConnection?: (id: string) => void
}

export default function ConnectionLines({ 
  connections, 
  tables, 
  nodes = [], 
  zoom, 
  onConnectionClick,
  onDeleteConnection 
}: ConnectionLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)

  const getElementPosition = (elementId: string, connectionType?: 'input' | 'output', index: number = 0) => {
    // Check if it's a table
    const table = tables.find(t => t.id === elementId)
    if (table) {
      return {
        x: connectionType === 'input' ? table.x : table.x + (table.width || 300),
        y: table.y + 60 + (index * 30),
      }
    }

    // Check if it's a transform node
    const node = nodes.find(n => n.id === elementId)
    if (node) {
      return {
        x: connectionType === 'input' ? node.x : node.x + 180,
        y: node.y + 30 + (index * 20),
      }
    }

    return null
  }

  const drawBezierPath = (source: any, target: any) => {
    if (!source || !target) return null

    const controlPointOffset = Math.abs(target.x - source.x) / 2
    const path = `M ${source.x} ${source.y} 
                  C ${source.x + controlPointOffset} ${source.y},
                    ${target.x - controlPointOffset} ${target.y},
                    ${target.x} ${target.y}`

    return path
  }

  const getConnectionColor = (connection: any) => {
    if (hoveredConnection === connection.id) return '#3B82F6'
    if (connection.type === 'data') return '#10B981'
    if (connection.type === 'transform') return '#8B5CF6'
    return '#6B7280'
  }

  return (
    <svg
      ref={svgRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <defs>
        {/* Arrow marker for connections */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3, 0 6"
            fill="#3B82F6"
          />
        </marker>

        {/* Animated gradient for active connections */}
        <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2">
            <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="1">
            <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2">
            <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>

      {connections.map((connection) => {
        const source = getElementPosition(
          connection.sourceId, 
          'output',
          connection.sourceIndex || 0
        )
        const target = getElementPosition(
          connection.targetId,
          'input', 
          connection.targetIndex || 0
        )
        
        if (!source || !target) return null
        
        const path = drawBezierPath(source, target)
        const connectionColor = getConnectionColor(connection)
        
        return (
          <g key={connection.id}>
            {/* Shadow/glow effect */}
            {hoveredConnection === connection.id && (
              <path
                d={path}
                stroke={connectionColor}
                strokeWidth="8"
                fill="none"
                opacity="0.2"
              />
            )}
            
            {/* Main connection line */}
            <path
              d={path}
              stroke={connectionColor}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              strokeDasharray={connection.type === 'pending' ? '5,5' : undefined}
              className="transition-all duration-200"
            />
            
            {/* Invisible wider path for better hover/click detection */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth="20"
              fill="none"
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
              onClick={() => onConnectionClick?.(connection.id)}
              onDoubleClick={() => onDeleteConnection?.(connection.id)}
            />

            {/* Connection label */}
            {connection.label && (
              <text
                x={(source.x + target.x) / 2}
                y={(source.y + target.y) / 2 - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 select-none"
                style={{ fontFamily: 'Inter' }}
              >
                {connection.label}
              </text>
            )}

            {/* Active flow animation */}
            {connection.active && (
              <circle r="4" fill="#3B82F6">
                <animateMotion dur="2s" repeatCount="indefinite">
                  <mpath href={`#path-${connection.id}`} />
                </animateMotion>
              </circle>
            )}
          </g>
        )
      })}
    </svg>
  )
}