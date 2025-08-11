import { useCallback, useState, useEffect } from 'react'
import { Node } from 'reactflow'

interface Guide {
  type: 'vertical' | 'horizontal'
  position: number
  nodes: string[]
}

interface SnapPoint {
  x?: number
  y?: number
  guides: Guide[]
}

const SNAP_THRESHOLD = 8

export function useSmartGuides(nodes: Node[], snapEnabled: boolean = true) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)

  const findSnapPoints = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (!snapEnabled) return { position, guides: [] }

    const currentNode = nodes.find(n => n.id === nodeId)
    if (!currentNode) return { position, guides: [] }

    const otherNodes = nodes.filter(n => n.id !== nodeId && n.type === 'frame')
    const snapGuides: Guide[] = []
    let snappedX = position.x
    let snappedY = position.y

    const nodeWidth = currentNode.data?.width || 800
    const nodeHeight = currentNode.data?.height || 600

    // Check for alignment with other nodes
    otherNodes.forEach(node => {
      const otherWidth = node.data?.width || 800
      const otherHeight = node.data?.height || 600

      // Vertical guides (left, center, right alignment)
      // Left edge alignment
      if (Math.abs(position.x - node.position.x) < SNAP_THRESHOLD) {
        snappedX = node.position.x
        snapGuides.push({
          type: 'vertical',
          position: node.position.x,
          nodes: [nodeId, node.id]
        })
      }
      // Right edge to left edge
      if (Math.abs(position.x - (node.position.x + otherWidth)) < SNAP_THRESHOLD) {
        snappedX = node.position.x + otherWidth
        snapGuides.push({
          type: 'vertical',
          position: node.position.x + otherWidth,
          nodes: [nodeId, node.id]
        })
      }
      // Right edge alignment
      if (Math.abs((position.x + nodeWidth) - (node.position.x + otherWidth)) < SNAP_THRESHOLD) {
        snappedX = node.position.x + otherWidth - nodeWidth
        snapGuides.push({
          type: 'vertical',
          position: node.position.x + otherWidth,
          nodes: [nodeId, node.id]
        })
      }
      // Center alignment
      const currentCenterX = position.x + nodeWidth / 2
      const otherCenterX = node.position.x + otherWidth / 2
      if (Math.abs(currentCenterX - otherCenterX) < SNAP_THRESHOLD) {
        snappedX = otherCenterX - nodeWidth / 2
        snapGuides.push({
          type: 'vertical',
          position: otherCenterX,
          nodes: [nodeId, node.id]
        })
      }

      // Horizontal guides (top, middle, bottom alignment)
      // Top edge alignment
      if (Math.abs(position.y - node.position.y) < SNAP_THRESHOLD) {
        snappedY = node.position.y
        snapGuides.push({
          type: 'horizontal',
          position: node.position.y,
          nodes: [nodeId, node.id]
        })
      }
      // Bottom edge to top edge
      if (Math.abs(position.y - (node.position.y + otherHeight)) < SNAP_THRESHOLD) {
        snappedY = node.position.y + otherHeight
        snapGuides.push({
          type: 'horizontal',
          position: node.position.y + otherHeight,
          nodes: [nodeId, node.id]
        })
      }
      // Bottom edge alignment
      if (Math.abs((position.y + nodeHeight) - (node.position.y + otherHeight)) < SNAP_THRESHOLD) {
        snappedY = node.position.y + otherHeight - nodeHeight
        snapGuides.push({
          type: 'horizontal',
          position: node.position.y + otherHeight,
          nodes: [nodeId, node.id]
        })
      }
      // Middle alignment
      const currentCenterY = position.y + nodeHeight / 2
      const otherCenterY = node.position.y + otherHeight / 2
      if (Math.abs(currentCenterY - otherCenterY) < SNAP_THRESHOLD) {
        snappedY = otherCenterY - nodeHeight / 2
        snapGuides.push({
          type: 'horizontal',
          position: otherCenterY,
          nodes: [nodeId, node.id]
        })
      }
    })

    // Check for canvas edge snapping
    const CANVAS_MARGIN = 20
    
    // Left edge
    if (Math.abs(position.x - CANVAS_MARGIN) < SNAP_THRESHOLD) {
      snappedX = CANVAS_MARGIN
      snapGuides.push({
        type: 'vertical',
        position: CANVAS_MARGIN,
        nodes: [nodeId]
      })
    }
    
    // Top edge
    if (Math.abs(position.y - CANVAS_MARGIN) < SNAP_THRESHOLD) {
      snappedY = CANVAS_MARGIN
      snapGuides.push({
        type: 'horizontal',
        position: CANVAS_MARGIN,
        nodes: [nodeId]
      })
    }

    return {
      position: { x: snappedX, y: snappedY },
      guides: snapGuides
    }
  }, [nodes, snapEnabled])

  const onNodeDragStart = useCallback((nodeId: string) => {
    setActiveNodeId(nodeId)
  }, [])

  const onNodeDrag = useCallback((nodeId: string, position: { x: number; y: number }) => {
    const snapResult = findSnapPoints(nodeId, position)
    setGuides(snapResult.guides)
    return snapResult.position
  }, [findSnapPoints])

  const onNodeDragStop = useCallback(() => {
    setActiveNodeId(null)
    setGuides([])
  }, [])

  // Alignment functions for multiple frames
  const alignFrames = useCallback((frameIds: string[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selectedNodes = nodes.filter(n => frameIds.includes(n.id))
    if (selectedNodes.length < 2) return

    let referenceValue: number
    const updatedNodes = [...nodes]

    switch (alignment) {
      case 'left':
        referenceValue = Math.min(...selectedNodes.map(n => n.position.x))
        frameIds.forEach(id => {
          const nodeIndex = updatedNodes.findIndex(n => n.id === id)
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...updatedNodes[nodeIndex].position, x: referenceValue }
            }
          }
        })
        break
      
      case 'right':
        const rightPositions = selectedNodes.map(n => n.position.x + (n.data?.width || 800))
        referenceValue = Math.max(...rightPositions)
        frameIds.forEach(id => {
          const nodeIndex = updatedNodes.findIndex(n => n.id === id)
          if (nodeIndex !== -1) {
            const width = updatedNodes[nodeIndex].data?.width || 800
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...updatedNodes[nodeIndex].position, x: referenceValue - width }
            }
          }
        })
        break
      
      case 'center':
        const centerXs = selectedNodes.map(n => n.position.x + (n.data?.width || 800) / 2)
        referenceValue = centerXs.reduce((a, b) => a + b, 0) / centerXs.length
        frameIds.forEach(id => {
          const nodeIndex = updatedNodes.findIndex(n => n.id === id)
          if (nodeIndex !== -1) {
            const width = updatedNodes[nodeIndex].data?.width || 800
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...updatedNodes[nodeIndex].position, x: referenceValue - width / 2 }
            }
          }
        })
        break
      
      case 'top':
        referenceValue = Math.min(...selectedNodes.map(n => n.position.y))
        frameIds.forEach(id => {
          const nodeIndex = updatedNodes.findIndex(n => n.id === id)
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...updatedNodes[nodeIndex].position, y: referenceValue }
            }
          }
        })
        break
      
      case 'bottom':
        const bottomPositions = selectedNodes.map(n => n.position.y + (n.data?.height || 600))
        referenceValue = Math.max(...bottomPositions)
        frameIds.forEach(id => {
          const nodeIndex = updatedNodes.findIndex(n => n.id === id)
          if (nodeIndex !== -1) {
            const height = updatedNodes[nodeIndex].data?.height || 600
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...updatedNodes[nodeIndex].position, y: referenceValue - height }
            }
          }
        })
        break
      
      case 'middle':
        const centerYs = selectedNodes.map(n => n.position.y + (n.data?.height || 600) / 2)
        referenceValue = centerYs.reduce((a, b) => a + b, 0) / centerYs.length
        frameIds.forEach(id => {
          const nodeIndex = updatedNodes.findIndex(n => n.id === id)
          if (nodeIndex !== -1) {
            const height = updatedNodes[nodeIndex].data?.height || 600
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: { ...updatedNodes[nodeIndex].position, y: referenceValue - height / 2 }
            }
          }
        })
        break
    }

    return updatedNodes
  }, [nodes])

  const distributeFrames = useCallback((frameIds: string[], direction: 'horizontal' | 'vertical', spacing: number = 20) => {
    const selectedNodes = nodes.filter(n => frameIds.includes(n.id))
    if (selectedNodes.length < 3) return

    const updatedNodes = [...nodes]

    if (direction === 'horizontal') {
      const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x)
      const totalWidth = sorted.reduce((sum, n) => sum + (n.data?.width || 800), 0)
      const totalGap = spacing * (sorted.length - 1)
      let currentX = sorted[0].position.x

      sorted.forEach((node, index) => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id)
        if (nodeIndex !== -1 && index > 0) {
          currentX += (updatedNodes[nodeIndex - 1].data?.width || 800) + spacing
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: { ...updatedNodes[nodeIndex].position, x: currentX }
          }
        }
      })
    } else {
      const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y)
      let currentY = sorted[0].position.y

      sorted.forEach((node, index) => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id)
        if (nodeIndex !== -1 && index > 0) {
          currentY += (updatedNodes[nodeIndex - 1].data?.height || 600) + spacing
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: { ...updatedNodes[nodeIndex].position, y: currentY }
          }
        }
      })
    }

    return updatedNodes
  }, [nodes])

  return {
    guides,
    activeNodeId,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    alignFrames,
    distributeFrames
  }
}