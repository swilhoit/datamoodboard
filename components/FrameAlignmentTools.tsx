'use client'

import React from 'react'
import { 
  AlignLeft, AlignCenterHorizontal, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Layers, Copy, Grid3X3, Minus, Plus, Move
} from 'lucide-react'

interface FrameAlignmentToolsProps {
  selectedFrames: string[]
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistribute: (type: 'horizontal' | 'vertical') => void
  onDuplicate: () => void
  onGroup: () => void
  onUngroup: () => void
  spacing: number
  onSpacingChange: (spacing: number) => void
}

export default function FrameAlignmentTools({
  selectedFrames,
  onAlign,
  onDistribute,
  onDuplicate,
  onGroup,
  onUngroup,
  spacing,
  onSpacingChange
}: FrameAlignmentToolsProps) {
  const hasMultipleSelected = selectedFrames.length > 1
  const hasSingleSelected = selectedFrames.length === 1

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-2">
      {/* Alignment Tools */}
      {hasMultipleSelected && (
        <>
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              onClick={() => onAlign('left')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Align left"
            >
              <AlignLeft size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => onAlign('center')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Align center"
            >
              <AlignCenterHorizontal size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => onAlign('right')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Align right"
            >
              <AlignRight size={16} className="text-gray-600" />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              onClick={() => onAlign('top')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Align top"
            >
              <AlignStartVertical size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => onAlign('middle')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Align middle"
            >
              <AlignCenterVertical size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => onAlign('bottom')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Align bottom"
            >
              <AlignEndVertical size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Distribution Tools */}
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              onClick={() => onDistribute('horizontal')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Distribute horizontally"
            >
              <Grid3X3 size={16} className="text-gray-600 rotate-90" />
            </button>
            <button
              onClick={() => onDistribute('vertical')}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Distribute vertically"
            >
              <Grid3X3 size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Spacing Control */}
          <div className="flex items-center gap-1 border-r pr-2">
            <button
              onClick={() => onSpacingChange(Math.max(0, spacing - 8))}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Decrease spacing"
            >
              <Minus size={16} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-600 w-8 text-center">{spacing}</span>
            <button
              onClick={() => onSpacingChange(spacing + 8)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Increase spacing"
            >
              <Plus size={16} className="text-gray-600" />
            </button>
          </div>
        </>
      )}

      {/* Duplication Tool */}
      {hasSingleSelected && (
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Duplicate frame"
        >
          <Copy size={16} className="text-gray-600" />
          <span className="text-xs text-gray-600">Duplicate</span>
        </button>
      )}

      {/* Group/Ungroup */}
      {hasMultipleSelected && (
        <button
          onClick={onGroup}
          className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Group frames"
        >
          <Layers size={16} className="text-gray-600" />
          <span className="text-xs text-gray-600">Group</span>
        </button>
      )}
    </div>
  )
}