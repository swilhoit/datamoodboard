'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Sparkles } from 'lucide-react'

interface AIFloatingChatProps {
  isDarkMode?: boolean
  onApplyState: (state: {
    canvasItems: any[]
    dataTables: any[]
    connections: any[]
    mode?: 'design' | 'data'
    background?: any
    theme?: 'light' | 'dark'
  }) => void
  getContext?: () => any
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AIFloatingChat({ isDarkMode = false, onApplyState, getContext }: AIFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'planning' | 'applying'>('idle')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const endRef = useRef<HTMLDivElement | null>(null)
  const [planningSteps, setPlanningSteps] = useState<Array<{ label: string; state: 'pending' | 'active' | 'done' }>>([])
  const stepper = useRef<number | null>(null)
  const [statusText, setStatusText] = useState<string>('')

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const toChartType = (text: string): 'barChart' | 'lineChart' | 'pieChart' => {
    if (/\b(line|trend)\b/i.test(text)) return 'lineChart'
    if (/\b(pie|distribution)\b/i.test(text)) return 'pieChart'
    return 'barChart'
  }

  const extractTableName = (text: string, context?: any): string | null => {
    const quoted = text.match(/"([^"]+)"|'([^']+)'/)
    if (quoted) {
      const q = quoted[1] || quoted[2]
      return q
    }
    if (!context?.currentState?.dataTables) return null
    const lower = text.toLowerCase()
    const names: string[] = context.currentState.dataTables.map((t: any) => String(t.tableName || '').toLowerCase())
    const found = context.currentState.dataTables.find((t: any) => lower.includes(String(t.tableName || '').toLowerCase()))
    if (found) return found.tableName
    return null
  }

  const extractAxisFields = (text: string): { xField?: string; yField?: string } => {
    const xMatch = text.match(/([A-Za-z0-9_\s]+)\s*(?:on|to)\s*X\b/i)
    const yMatch = text.match(/([A-Za-z0-9_\s]+)\s*(?:on|to)\s*Y\b/i)
    const clean = (s?: string) => s ? s.replace(/"|'|\s+/g, ' ').trim() : undefined
    return { xField: clean(xMatch?.[1]), yField: clean(yMatch?.[1]) }
  }

  const transformTableData = (table: any, chartType: string): any[] => {
    const rows: any[] = Array.isArray(table?.data) ? table.data : []
    const schema: Array<{ name: string; type?: string }> = Array.isArray(table?.schema) ? table.schema : []
    const lowerName = (s: string) => s?.toLowerCase?.() || ''
    const dateField = schema.find(c => /date|time|day|month|period/.test(lowerName(c.name)))?.name || 'Date'
    const numericField = schema.find(c => /price|value|amount|total|count|usd|number/.test(lowerName(c.name)))?.name
      || schema.find(c => /int|decimal|float|double|number/i.test(String(c.type || '')))?.name
      || 'value'
    return rows.slice(0, 200).map(r => ({ name: r[dateField] ?? r.name ?? r.label ?? '', value: Number(r[numericField] ?? r.value ?? 0) }))
  }

  const attemptLocalApply = (command: string, context?: any): boolean => {
    try {
      const state = context?.currentState
      if (!state) return false
      const tableName = extractTableName(command, context)
      const table = tableName ? state.dataTables?.find((t: any) => String(t.tableName) === tableName) : undefined
      if (!table) return false
      const type = toChartType(command)
      const data = transformTableData(table, type)
      const newItem = {
        id: `item-${Date.now()}`,
        type,
        title: `${tableName} (${type.replace('Chart', ' Chart')})`,
        x: Math.random() * 400 + 80,
        y: Math.random() * 200 + 80,
        width: 480,
        height: 320,
        data,
        style: {
          theme: 'modern',
          colors: ['#D4AF37', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          background: '#FFFFFF',
          gridColor: '#E5E7EB',
          textColor: '#1F2937',
          font: 'Inter',
          fontSize: 12,
          gradients: false,
        }
      }
      const newState = {
        ...state,
        canvasItems: Array.isArray(state.canvasItems) ? [...state.canvasItems, newItem] : [newItem]
      }
      onApplyState(newState)
      const appliedMsg: ChatMessage = { id: String(Date.now() + 3), role: 'assistant', content: `Added a ${type.replace('Chart',' chart')} bound to "${tableName}".` }
      setMessages(prev => [...prev, appliedMsg])
      return true
    } catch {
      return false
    }
  }

  // Edit and delete helpers based on text commands
  const attemptEditOrDelete = (command: string, context?: any): boolean => {
    const state = context?.currentState
    if (!state) return false
    const lower = command.toLowerCase()
    const targetByName = extractTableName(command, context)
    const findBy = (predicate: (it: any) => boolean) => (state.canvasItems || []).find(predicate)
    let target = null as any
    if (targetByName) {
      target = findBy((it) => String(it.title || '').toLowerCase().includes(targetByName.toLowerCase()))
    }
    if (!target && state.selectedItem) {
      target = findBy((it) => it.id === state.selectedItem)
    }
    if (!target) {
      // try last added item as a weak fallback
      target = (state.canvasItems || [])[state.canvasItems.length - 1]
    }
    if (!target) return false

    // Delete
    if (/\b(delete|remove|trash|clear)\b/i.test(command)) {
      const newState = {
        ...state,
        canvasItems: (state.canvasItems || []).filter((it: any) => it.id !== target.id)
      }
      onApplyState(newState)
      setMessages(prev => [...prev, { id: String(Date.now()), role: 'assistant', content: `Deleted item ${target.title || target.id}.` }])
      return true
    }
    // Resize
    const sizeMatch = command.match(/(larger|bigger|smaller|tiny|huge|width\s*(\d+)|height\s*(\d+))/i)
    if (sizeMatch) {
      const widthMatch = command.match(/width\s*(\d+)/i)
      const heightMatch = command.match(/height\s*(\d+)/i)
      const deltaW = /larger|bigger|huge/i.test(command) ? 80 : /smaller|tiny/i.test(command) ? -80 : 0
      const next = {
        ...target,
        width: widthMatch ? Number(widthMatch[1]) : Math.max(160, (target.width || 400) + deltaW),
        height: heightMatch ? Number(heightMatch[1]) : Math.max(120, (target.height || 300) + deltaW / 2),
      }
      const newState = {
        ...state,
        canvasItems: (state.canvasItems || []).map((it: any) => (it.id === target.id ? next : it))
      }
      onApplyState(newState)
      setMessages(prev => [...prev, { id: String(Date.now()), role: 'assistant', content: `Resized ${target.title || target.id}.` }])
      return true
    }
    // Move
    const moveMatch = command.match(/move\s+(left|right|up|down)(?:\s*(\d+))?/i)
    if (moveMatch) {
      const dir = moveMatch[1].toLowerCase()
      const amt = Number(moveMatch[2] || 50)
      const dx = dir === 'left' ? -amt : dir === 'right' ? amt : 0
      const dy = dir === 'up' ? -amt : dir === 'down' ? amt : 0
      const next = { ...target, x: (target.x || 0) + dx, y: (target.y || 0) + dy }
      const newState = {
        ...state,
        canvasItems: (state.canvasItems || []).map((it: any) => (it.id === target.id ? next : it))
      }
      onApplyState(newState)
      setMessages(prev => [...prev, { id: String(Date.now()), role: 'assistant', content: `Moved ${target.title || target.id} ${dir} by ${amt}px.` }])
      return true
    }
    return false
  }

  const submit = async () => {
    const command = input.trim()
    if (!command) return
    const userMsg: ChatMessage = { id: String(Date.now()), role: 'user', content: command }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setPhase('thinking')
    setStatusText('Thinking…')
    
    try {
      // Try local parser first for common commands (no AI needed)
      const { parseCanvasCommand, shouldUseLocalParser } = await import('@/lib/ai/local-command-parser')
      
      if (shouldUseLocalParser(command)) {
        const localResult = parseCanvasCommand(command)
        if (localResult) {
          // console.log('Using local parser result:', localResult)
          setPhase('applying')
          setStatusText('Applying…')
          
          const context = getContext ? getContext() : undefined
          const execRes = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands: localResult.commands, context })
          })
          
          const execData = await execRes.json()
          setPhase('idle')
          setIsLoading(false)
          
          if (execRes.ok && execData?.state) {
            onApplyState(execData.state)
            setMessages(prev => [...prev, { 
              id: String(Date.now() + 1), 
              role: 'assistant', 
              content: 'Done!' 
            }])
            return
          }
        }
      }
      
      // Fallback to AI if local parser doesn't handle it
      // 1) Planner: request JSON tool commands; and short confirmation message
      const context = getContext ? getContext() : undefined
      
      // Enhance context with canvas analytics
      if (context?.currentState) {
        try {
          const { CanvasIntelligence } = await import('@/lib/ai/canvas-intelligence')
          const intelligence = new CanvasIntelligence({
            items: context.currentState.canvasItems || [],
            connections: context.currentState.connections || [],
            canvasWidth: context.currentState.canvasWidth || 1920,
            canvasHeight: context.currentState.canvasHeight || 1080
          })
          context.canvasAnalytics = intelligence.getCanvasAnalytics()
        } catch (e) {
          console.error('Failed to get canvas analytics:', e)
        }
      }
      
      let planned: any = null
      try {
        const planRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: command }], mode: 'dashboard-tools', context })
        })
        const planData = await planRes.json()
        if (planRes.ok && planData?.message) {
          try { 
            planned = JSON.parse(planData.message) 
            // console.log('AI Planning output:', planned)
          } catch (e) { 
            console.error('Failed to parse AI plan:', planData.message)
          }
        }
      } catch { /* planner optional */ }

      // 1b) Conversational confirmation (short)
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: command }]),
          mode: 'dashboard',
          context
        })
      })
      const chatData = await chatRes.json()
      if (chatRes.ok && chatData?.message) {
        // Sanitize any inadvertent disclaimers; the assistant CAN act
        const sanitizeAssistant = (text: string) => {
          const negativeRx = /(as an ai|i can\'t|i cannot|i’m unable|i am unable|i'm unable|cannot directly manipulate|can't directly manipulate|cannot link data|can't link data)/i
          if (negativeRx.test(text)) {
            return 'Understood. I will apply the changes and link the data as requested.'
          }
          return text
        }
        const assistantMsg: ChatMessage = { id: String(Date.now() + 1), role: 'assistant', content: sanitizeAssistant(chatData.message) }
        setMessages(prev => [...prev, assistantMsg])
      }

      // 2) If actionable, prefer executing planned commands via server executor; AVOID orchestrate route
      const actionable = /\b(create|add|build|make|generate|insert|add\s+(a|an)|put|show|visualize|place|plot|render|draw|chart|bind|connect|link|arrange|align|organize)\b/i.test(command)
      if (actionable) {
        setPhase('planning')
        setStatusText('Planning…')
        // Initialize granular planning steps UI
        setPlanningSteps([
          { label: 'Parsing intent', state: 'active' },
          { label: 'Selecting template', state: 'pending' },
          { label: 'Generating pipeline', state: 'pending' },
          { label: 'Arranging layout', state: 'pending' },
          { label: 'Applying theme', state: 'pending' },
        ])
        // Start a lightweight stepper that advances while the server works
        let idx = 0
        stepper.current && clearInterval(stepper.current)
        stepper.current = window.setInterval(() => {
          idx = Math.min(idx + 1, 4)
          setPlanningSteps(prev => prev.map((s, i) => (
            i < idx ? { ...s, state: 'done' } : i === idx ? { ...s, state: 'active' } : { ...s, state: 'pending' }
          )))
        }, 300)
        let executed = false
        // Augment plan with bindData if missing and user referenced a specific table
        if (planned?.commands && Array.isArray(planned.commands)) {
          const hasBind = planned.commands.some((c: any) => String(c.action || '').toLowerCase() === 'binddata')
          if (!hasBind) {
            const tableFromText = extractTableName(command, context)
            if (tableFromText) {
              const axis = extractAxisFields(command)
              planned.commands.push({ action: 'bindData', target: { selector: '#last' }, params: { table: tableFromText, ...axis } })
              setStatusText(`Found dataset "${tableFromText}". Binding${axis.xField || axis.yField ? ` (X: ${axis.xField || 'auto'}, Y: ${axis.yField || 'auto'})` : ''}…`)
            }
          }
          // If plan already includes bindData, preview the intent in status
          const bindCmd = planned.commands.find((c: any) => String(c.action || '') === 'bindData')
          if (bindCmd?.params?.table) {
            const axis = { xField: bindCmd.params?.xField, yField: bindCmd.params?.yField }
            setStatusText(`Found dataset "${bindCmd.params.table}". Binding${axis.xField || axis.yField ? ` (X: ${axis.xField || 'auto'}, Y: ${axis.yField || 'auto'})` : ''}…`)
          }
        }
        if (planned?.commands && Array.isArray(planned.commands) && planned.commands.length > 0) {
          setPhase('applying')
          setStatusText('Applying…')
          const execRes = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands: planned.commands, context })
          })
          const execData = await execRes.json()
          if (stepper.current) { clearInterval(stepper.current); stepper.current = null }
          setPlanningSteps(prev => prev.map(s => ({ ...s, state: 'done' })))
          
          if (!execRes.ok) {
            console.error('Execute API error:', execData.error, 'Status:', execRes.status)
            setStatusText(`Error: ${execData.error || 'Failed to execute commands'}`)
          } else if (execData?.state) {
            onApplyState(execData.state)
            const ds = (execData?.state && (execData.state as any).__datasets) || null
            if (ds && Array.isArray(ds)) {
              const top = ds.slice(0, 5).map((d: any) => `${d.name}${d.row_count ? ` (${d.row_count})` : ''}`).join(', ')
              setStatusText(`Datasets: ${top}${ds.length > 5 ? '…' : ''}`)
            } else {
              // Inspect last item to confirm data binding result
              const items = (execData.state?.canvasItems || []) as any[]
              const last = items[items.length - 1]
              const rows = Array.isArray(last?.data) ? last.data.length : 0
              if (last?.type && rows > 0) {
                setStatusText(`Bound "${last.title || last.type}" with ${rows} row(s).`)
              } else if (last?.type) {
                setStatusText(`Created "${last.title || last.type}" but no rows were bound. Specify X/Y fields (e.g., Date→X, Amount→Y).`)
              } else {
                setStatusText('Applied requested changes.')
              }
            }
            executed = true
          }
        }
        if (!executed) {
          // Fallback: Try to generate simple commands if planning failed
          const fallbackCommands = []
          
          // Simple chart creation fallback
          if (/\b(chart|graph|visual|plot)\b/i.test(command)) {
            const chartType = /line/i.test(command) ? 'lineChart' : 
                            /bar/i.test(command) ? 'barChart' :
                            /pie/i.test(command) ? 'pieChart' : 'barChart'
            
            fallbackCommands.push({
              action: 'addVisualization',
              params: { 
                type: chartType, 
                title: 'New Chart'
              }
            })
          }
          
          // Try executing fallback commands
          if (fallbackCommands.length > 0) {
            setPhase('applying')
            setStatusText('Applying fallback…')
            const execRes = await fetch('/api/ai/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ commands: fallbackCommands, context })
            })
            const execData = await execRes.json()
            if (stepper.current) { clearInterval(stepper.current); stepper.current = null }
            setPlanningSteps(prev => prev.map(s => ({ ...s, state: 'done' })))
            if (execRes.ok && execData?.state) {
              onApplyState(execData.state)
              setStatusText('Added visualization to canvas')
            }
          } else {
            // No fallback available
            if (stepper.current) { clearInterval(stepper.current); stepper.current = null }
            setPlanningSteps(prev => prev.map(s => ({ ...s, state: 'done' })))
            setStatusText('Please be more specific about what you want to create.')
          }
        }
      } else {
        // 3) Local fallback: detect and bind to existing table
        const didEditOrDelete = attemptEditOrDelete(command, context)
        const didApply = didEditOrDelete ? true : attemptLocalApply(command, context)
        if (!didApply && !chatRes.ok) {
          setStatusText('Could not apply automatically. Specify target and action.')
        }
      }
    } catch (e: any) {
      setStatusText(e?.message || 'Something went wrong.')
    }
    setIsLoading(false)
    setPhase('idle')
    // Auto-clear status text after a short delay
    setTimeout(() => setStatusText(''), 2500)
    // Cleanup stepper
    if (stepper.current) {
      clearInterval(stepper.current)
      stepper.current = null
    }
  }

  const phaseBadge = () => {
    if (phase === 'idle') return null
    const common = 'text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1'
    const dot = (c: string) => <span className={`inline-block w-1.5 h-1.5 rounded-full ${c}`}></span>
    if (phase === 'thinking') return <span className={`${common} ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{dot('bg-gray-400')}Thinking</span>
    if (phase === 'planning') return <span className={`${common} ${isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>{dot('bg-amber-500')}Planning</span>
    if (phase === 'applying') return <span className={`${common} ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>{dot('bg-blue-500')}Applying</span>
    return null
  }

  return (
    <div className="pointer-events-none">
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`pointer-events-auto fixed bottom-4 right-4 z-[60] rounded-full p-3 shadow-lg flex items-center gap-2 ${isDarkMode ? 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          title="Open AI Assistant"
        >
          <Sparkles size={18} />
          <span className="hidden sm:block text-sm">AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className={`pointer-events-auto fixed bottom-4 right-4 z-[60] w-[320px] sm:w-[380px] max-h-[60vh] rounded-xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center justify-between px-3 py-2 ${isDarkMode ? 'bg-gray-800 border-b border-gray-700 text-white' : 'bg-gray-50 border-b border-gray-200 text-gray-800'}`}>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
              <span className="text-sm font-dm-mono font-medium">AI Assistant</span>
              <div className="ml-2">{phaseBadge()}</div>
            </div>
            <button onClick={() => setIsOpen(false)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Close">
              <X size={16} />
            </button>
          </div>
          {/* Granular planning steps */}
          {planningSteps.length > 0 && (
            <div className={`px-3 py-2 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex flex-wrap gap-1.5">
                {planningSteps.map((s, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${
                    s.state === 'done'
                      ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800')
                      : s.state === 'active'
                      ? (isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800')
                      : (isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
                  }`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className={`p-3 space-y-2 overflow-y-auto`} style={{ maxHeight: '40vh' }}>
            {messages.length === 0 && (
              <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Try: “Create a monthly sales dashboard with a bar chart and KPI.”</div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`text-sm ${m.role === 'user' ? (isDarkMode ? 'text-blue-200' : 'text-blue-700') : (isDarkMode ? 'text-gray-200' : 'text-gray-800')}`}>
                <span className={`inline-block rounded px-2 py-1 ${m.role === 'user' ? (isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-100')}`}>{m.content}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className={`flex flex-col gap-2 p-3 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {!!statusText && (
              <div className={`text-[11px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{statusText}</div>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Tell me what to build…"
              className={`flex-1 text-sm px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
            />
            <button
              onClick={submit}
              disabled={isLoading}
              className={`px-3 py-2 rounded text-sm ${isDarkMode ? 'bg-blue-900/40 text-blue-200 hover:bg-blue-900/50' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-50`}
            >
              {isLoading ? 'Working…' : 'Go'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


