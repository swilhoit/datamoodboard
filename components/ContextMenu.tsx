'use client'

import React, { useEffect, useRef } from 'react'
import { 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  ArrowUpToLine, 
  ArrowDownToLine,
  Type,
  Square,
  Circle,
  Image,
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Palette,
  Layers
} from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  selectedItem?: any
  onAction: (action: string, data?: any) => void
}

export default function ContextMenu({ x, y, onClose, selectedItem, onAction }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Adjust menu position to prevent going off-screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [x, y])

  const MenuItem = ({ icon: Icon, label, onClick, shortcut, danger = false }: any) => (
    <button
      onClick={() => {
        onClick()
        onClose()
      }}
      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-100 transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      }`}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-gray-400">{shortcut}</span>}
    </button>
  )

  const Divider = () => <div className="border-t border-gray-200 my-1" />

  // Context menu for selected items
  if (selectedItem) {
    return (
      <div
        ref={menuRef}
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px]"
        style={{ left: x, top: y }}
      >
        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
          {selectedItem.type === 'text' ? 'Text' : 
           selectedItem.type === 'shape' ? 'Shape' : 
           selectedItem.type?.includes('Chart') || selectedItem.type?.includes('chart') ? 'Chart' : 
           'Element'}
        </div>
        <Divider />
        
        <MenuItem
          icon={Copy}
          label="Duplicate"
          onClick={() => onAction('duplicate')}
          shortcut="⌘D"
        />
        
        <Divider />
        
        <div className="px-3 py-1 text-xs text-gray-500">Layer Order</div>
        <MenuItem
          icon={ArrowUpToLine}
          label="Bring to Front"
          onClick={() => onAction('bringToFront')}
          shortcut="⌘]"
        />
        <MenuItem
          icon={ArrowUp}
          label="Bring Forward"
          onClick={() => onAction('bringForward')}
          shortcut="]"
        />
        <MenuItem
          icon={ArrowDown}
          label="Send Backward"
          onClick={() => onAction('sendBackward')}
          shortcut="["
        />
        <MenuItem
          icon={ArrowDownToLine}
          label="Send to Back"
          onClick={() => onAction('sendToBack')}
          shortcut="⌘["
        />
        
        <Divider />
        
        <MenuItem
          icon={Trash2}
          label="Delete"
          onClick={() => onAction('delete')}
          shortcut="⌫"
          danger
        />
      </div>
    )
  }

  // Context menu for blank canvas
  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">Add Element</div>
      <Divider />
      
      <MenuItem
        icon={Type}
        label="Text"
        onClick={() => onAction('addText', { x: x - 50, y: y - 20 })}
      />
      <MenuItem
        icon={Square}
        label="Rectangle"
        onClick={() => onAction('addShape', { type: 'rectangle', x: x - 50, y: y - 50 })}
      />
      <MenuItem
        icon={Circle}
        label="Circle"
        onClick={() => onAction('addShape', { type: 'circle', x: x - 50, y: y - 50 })}
      />
      <MenuItem
        icon={Image}
        label="Image"
        onClick={() => onAction('addImage', { x: x - 75, y: y - 75 })}
      />
      
      <Divider />
      <div className="px-3 py-1 text-xs text-gray-500">Charts</div>
      
      <MenuItem
        icon={LineChart}
        label="Line Chart"
        onClick={() => onAction('addChart', { type: 'lineChart', x: x - 200, y: y - 150 })}
      />
      <MenuItem
        icon={BarChart3}
        label="Bar Chart"
        onClick={() => onAction('addChart', { type: 'barChart', x: x - 200, y: y - 150 })}
      />
      <MenuItem
        icon={PieChart}
        label="Pie Chart"
        onClick={() => onAction('addChart', { type: 'pieChart', x: x - 150, y: y - 150 })}
      />
      <MenuItem
        icon={Table}
        label="Table"
        onClick={() => onAction('addChart', { type: 'table', x: x - 200, y: y - 150 })}
      />
      
      <Divider />
      
      <MenuItem
        icon={Palette}
        label="Change Background"
        onClick={() => onAction('changeBackground')}
      />
      <MenuItem
        icon={Layers}
        label="Show Layers"
        onClick={() => onAction('showLayers')}
      />
    </div>
  )
}