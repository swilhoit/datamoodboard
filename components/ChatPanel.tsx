'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, BarChart2, LineChart, PieChart, TrendingUp, Grid3x3, Sparkles, Database, Table, Link2, ChevronRight, ChevronLeft, MessageCircle } from 'lucide-react'
import { CanvasMode, DatabaseType } from '@/app/page'

interface ChatPanelProps {
  mode: CanvasMode
  onAddVisualization: (type: string, data?: any) => void
  onAddDataTable: (database: DatabaseType, tableName: string, schema?: any) => void
  onAddConnection: (sourceId: string, targetId: string, sourceField?: string, targetField?: string) => void
  selectedItem: string | null
  canvasItems: any[]
  dataTables: any[]
  connections: any[]
  isOpen: boolean
  onToggle: () => void
  taggedElement?: { id: string, name: string } | null
  isDarkMode?: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  taggedElement?: { id: string, name: string }
}

export default function ChatPanel({ 
  mode, 
  onAddVisualization, 
  onAddDataTable, 
  onAddConnection,
  selectedItem, 
  canvasItems,
  dataTables,
  connections,
  isOpen,
  onToggle,
  taggedElement,
  isDarkMode
}: ChatPanelProps) {
  const getInitialMessage = () => {
    if (mode === 'design') {
      return 'Hello! I\'m your data visualization assistant. I can help you create charts, analyze data, and build interactive visualizations. Try asking me to create a chart or drag one of the visualization tools below onto the canvas!'
    } else {
      return 'Welcome to Data Mode! I can help you connect to databases, manage tables, and create relationships. You can add tables from BigQuery, PostgreSQL, MySQL, MongoDB, Snowflake, or Redshift. Try the quick-add buttons below or ask me to add a specific table!'
    }
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getInitialMessage(),
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle tagged element
  useEffect(() => {
    if (taggedElement && isOpen) {
      setInput(`@${taggedElement.name} `)
      // Focus on input
      const inputElement = document.getElementById('chat-input') as HTMLInputElement
      if (inputElement) {
        inputElement.focus()
        // Move cursor to end
        const len = inputElement.value.length
        inputElement.setSelectionRange(len, len)
      }
    }
  }, [taggedElement, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      taggedElement: input.includes('@') && taggedElement ? taggedElement : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Get context for the AI
    const context = {
      mode,
      selectedItem,
      itemsCount: mode === 'design' ? canvasItems.length : dataTables.length,
      hasConnections: connections.length > 0,
      taggedElement
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: input }
          ],
          mode,
          context
        }),
      })

      const data = await response.json()
      setIsTyping(false)
      
      if (response.ok && data.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Parse response for actions
        const localResponse = generateResponse(data.message, taggedElement)
        if (localResponse.action) {
          onAddVisualization(localResponse.action.type, {})
        }
      } else {
        // Fallback to local response if API fails
        const localResponse = generateResponse(input, taggedElement)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: localResponse.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
        
        if (localResponse.action) {
          onAddVisualization(localResponse.action.type, {})
        }
      }
    } catch (error) {
      console.error('Chat API error:', error)
      setIsTyping(false)
      
      // Fallback to local response
      const localResponse = generateResponse(input, taggedElement)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: localResponse.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      
      if (localResponse.action) {
        onAddVisualization(localResponse.action.type, {})
      }
    }
  }

  const generateResponse = (input: string, tagged?: { id: string, name: string } | null) => {
    const lowerInput = input.toLowerCase()
    
    // Handle tagged element queries
    if (tagged && lowerInput.includes('@')) {
      const elementType = canvasItems.find(i => i.id === tagged.id)?.type || 
                         dataTables.find(t => t.id === tagged.id)?.tableName
      
      if (lowerInput.includes('change') || lowerInput.includes('modify')) {
        return {
          message: `I understand you want to modify "${tagged.name}". You can:\n• Click and drag to move it\n• Drag corners to resize\n• Double-click to edit properties\n• Use the design toolbar for styling options`
        }
      } else if (lowerInput.includes('delete') || lowerInput.includes('remove')) {
        return {
          message: `To delete "${tagged.name}", select it and press the Delete key, or click the X button in its header.`
        }
      } else if (lowerInput.includes('connect')) {
        return {
          message: `To connect "${tagged.name}" to another element, drag from its output connection point (green dot) to another element's input (blue dot).`
        }
      } else {
        return {
          message: `"${tagged.name}" is a ${elementType}. What would you like to know or do with it?`
        }
      }
    }
    
    if (mode === 'data') {
      // Data mode responses
      if (lowerInput.includes('bigquery') || lowerInput.includes('big query')) {
        onAddDataTable('bigquery', 'users')
        return {
          message: 'I\'ve added a BigQuery users table to the canvas. You can drag it around and connect it to other tables.',
        }
      } else if (lowerInput.includes('postgres') || lowerInput.includes('postgresql')) {
        onAddDataTable('postgresql', 'orders')
        return {
          message: 'I\'ve added a PostgreSQL orders table. You can expand/collapse it and create relationships with other tables.',
        }
      } else if (lowerInput.includes('mysql')) {
        onAddDataTable('mysql', 'products')
        return {
          message: 'I\'ve added a MySQL products table to your data model.',
        }
      } else if (lowerInput.includes('connect') || lowerInput.includes('relationship')) {
        return {
          message: 'To create a connection, drag from the green output dot on one element to the blue input dot on another. You can connect tables to transform nodes, and transform nodes to charts.',
        }
      } else if (lowerInput.includes('help')) {
        return {
          message: 'In Data Mode, you can:\n• Add tables from various databases\n• Create relationships between tables\n• Add transform nodes (filter, join, aggregate)\n• Connect data to chart outputs\n• Use Quick Start templates for common scenarios\n\nSupported databases: BigQuery, PostgreSQL, MySQL, MongoDB, Snowflake, Redshift, Google Sheets',
        }
      } else {
        return {
          message: 'I can help you add tables from databases like BigQuery, PostgreSQL, MySQL, MongoDB, Snowflake, or Redshift. You can also connect to Google Sheets for real data import!',
        }
      }
    }
    
    // Dashboard mode responses
    if (lowerInput.includes('line') || lowerInput.includes('trend')) {
      return {
        message: 'I\'ve created a line chart for you showing trend data over time. You can drag it around the canvas and resize it as needed.',
        action: { type: 'lineChart' }
      }
    } else if (lowerInput.includes('bar') || lowerInput.includes('comparison')) {
      return {
        message: 'I\'ve added a bar chart to visualize comparative data. Feel free to customize it by clicking on it!',
        action: { type: 'barChart' }
      }
    } else if (lowerInput.includes('pie') || lowerInput.includes('distribution')) {
      return {
        message: 'Here\'s a pie chart showing the distribution of your data. You can interact with it on the canvas.',
        action: { type: 'pieChart' }
      }
    } else if (lowerInput.includes('help')) {
      return {
        message: 'I can help you create various visualizations:\n• Line charts for trends\n• Bar charts for comparisons\n• Pie charts for distributions\n• Area charts for cumulative data\n• Scatter plots for correlations\n\nYou can also:\n• Use Quick Start templates\n• Select multiple chart libraries\n• Apply beautiful themes\n• Add text, images, and shapes'
      }
    } else if (selectedItem && lowerInput.includes('selected')) {
      return {
        message: `You have selected a ${canvasItems.find(i => i.id === selectedItem)?.type || 'visualization'}. You can resize it by dragging the corners or move it around the canvas.`
      }
    } else {
      return {
        message: 'I can help you create data visualizations! Try asking me to create a line chart, bar chart, or pie chart. You can also drag the visualization tools below onto the canvas.'
      }
    }
  }

  const visualizationTools = [
    { type: 'lineChart', icon: LineChart, label: 'Line Chart', color: 'text-blue-600' },
    { type: 'barChart', icon: BarChart2, label: 'Bar Chart', color: 'text-green-600' },
    { type: 'pieChart', icon: PieChart, label: 'Pie Chart', color: 'text-purple-600' },
    { type: 'scatter', icon: Grid3x3, label: 'Scatter Plot', color: 'text-orange-600' },
    { type: 'area', icon: TrendingUp, label: 'Area Chart', color: 'text-pink-600' },
  ]

  const databaseTools = [
    { database: 'bigquery' as DatabaseType, label: 'BigQuery', icon: '🔷' },
    { database: 'postgresql' as DatabaseType, label: 'PostgreSQL', icon: '🐘' },
    { database: 'mysql' as DatabaseType, label: 'MySQL', icon: '🐬' },
    { database: 'mongodb' as DatabaseType, label: 'MongoDB', icon: '🍃' },
    { database: 'snowflake' as DatabaseType, label: 'Snowflake', icon: '❄️' },
    { database: 'redshift' as DatabaseType, label: 'Redshift', icon: '🔴' },
  ]

  // Collapsed state
  if (!isOpen) {
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 rounded-l-lg p-3 transition-all-smooth hover-lift button-press shadow-md z-10 ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white' 
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          title="Open chat"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft size={20} />
            <MessageCircle size={20} />
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className={`w-96 h-full flex flex-col relative animate-slideInRight ${
      isDarkMode ? 'bg-gray-900 border-l border-gray-700' : 'bg-white border-l border-gray-200'
    }`}>
      {/* Collapse button */}
      <button
        onClick={onToggle}
        className={`absolute -left-10 top-4 rounded-l-lg p-2 transition-all-smooth button-press shadow-md ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white' 
            : 'bg-white border border-gray-200 hover:bg-gray-50'
        }`}
        title="Collapse chat"
      >
        <ChevronRight size={20} />
      </button>

      <div className={`p-4 ${isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
        <div className="flex items-center gap-2">
          {mode === 'design' ? (
            <Sparkles className="text-blue-400" size={24} />
          ) : (
            <Database className="text-green-400" size={24} />
          )}
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {mode === 'design' ? 'Visualization Assistant' : 'Data Assistant'}
          </h2>
        </div>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {mode === 'design' 
            ? 'Create and customize visualizations'
            : 'Connect databases and manage tables'
          }
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.taggedElement && (
                <div className={`text-xs mb-1 ${
                  message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  @{message.taggedElement.name}
                </div>
              )}
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2">
            {mode === 'design' ? 'Quick add visualizations:' : 'Quick add data sources:'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {mode === 'design' ? (
              visualizationTools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => onAddVisualization(tool.type)}
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  title={`Add ${tool.label}`}
                >
                  <tool.icon size={20} className={tool.color} />
                  <span className="text-xs mt-1">{tool.label}</span>
                </button>
              ))
            ) : (
              databaseTools.map((tool) => (
                <button
                  key={tool.database}
                  onClick={() => {
                    const tableNames = ['users', 'orders', 'products', 'analytics', 'events']
                    const randomTable = tableNames[Math.floor(Math.random() * tableNames.length)]
                    onAddDataTable(tool.database, randomTable)
                  }}
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  title={`Add ${tool.label} table`}
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <span className="text-xs mt-1">{tool.label}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={mode === 'design' 
              ? "Ask about data or request a chart..." 
              : "Add a table or ask about connections..."
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}