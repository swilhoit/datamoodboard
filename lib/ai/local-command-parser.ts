/**
 * Local command parser - ZERO AI, pure pattern matching
 * This completely eliminates AI hallucination for common commands
 */

interface ParsedCommand {
  commands: Array<{
    action: string;
    params?: any;
    target?: any;
  }>;
}

/**
 * Parse user input without AI - 100% deterministic
 */
export function parseCanvasCommand(input: string): ParsedCommand | null {
  const lower = input.toLowerCase().trim();
  
  // Helper to extract table/data source name from text
  const extractTableName = (text: string): string | null => {
    // Match patterns like: "from tablename", "using tablename", "with tablename", "of tablename", or quoted names
    const match = text.match(/(?:from|using|with|of|for)\s+["']?([^"'\s,]+)["']?/i) ||
                  text.match(/["']([^"']+)["']/) ||
                  text.match(/\b(\w+)\s+(?:data|table|dataset)\b/i);
    return match ? match[1] : null;
  };
  
  // Emoji detection
  const emojiRegex = /(?:add|insert|place|put)\s*(?:a|an|the)?\s*(.+?)\s*emoji/i;
  const emojiMatch = input.match(emojiRegex);
  if (emojiMatch) {
    const emojiMap: Record<string, string> = {
      'dog': '🐶', 'cat': '🐱', 'heart': '❤️', 'star': '⭐',
      'smile': '😊', 'laugh': '😂', 'fire': '🔥', 'party': '🎉',
      'rocket': '🚀', 'moon': '🌙', 'sun': '☀️', 'rainbow': '🌈',
      'pizza': '🍕', 'coffee': '☕', 'beer': '🍺', 'wine': '🍷',
      'cake': '🎂', 'gift': '🎁', 'money': '💰', 'crown': '👑',
      'thumbs up': '👍', 'clap': '👏', 'wave': '👋', 'ok': '👌'
    };
    
    const emojiType = emojiMatch[1].toLowerCase();
    const emoji = emojiMap[emojiType] || '❓';
    
    return {
      commands: [{
        action: 'addElement',
        params: { type: 'emoji', emoji, fontSize: 48 }
      }]
    };
  }
  
  // Direct emoji in text
  const directEmoji = /(?:add|insert|place|put)\s*(?:a|an|the)?\s*([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u;
  const directMatch = input.match(directEmoji);
  if (directMatch) {
    return {
      commands: [{
        action: 'addElement',
        params: { type: 'emoji', emoji: directMatch[1], fontSize: 48 }
      }]
    };
  }
  
  // Text detection
  if (lower.includes('text')) {
    const textMatch = input.match(/(?:saying|that says|with text|reading)\s*["\']?(.+?)["\']?$/i);
    const text = textMatch ? textMatch[1] : 'New Text';
    
    return {
      commands: [{
        action: 'addElement',
        params: { type: 'text', text, fontSize: 16 }
      }]
    };
  }
  
  // Chart detection with data binding
  const chartTypes = {
    'bar': 'barChart',
    'line': 'lineChart',
    'pie': 'pieChart',
    'area': 'areaChart',
    'scatter': 'scatterPlot'
  };
  
  // Generic chart creation (e.g., "create chart from sales")
  if ((lower.includes('chart') || lower.includes('graph') || lower.includes('visualization')) && 
      (lower.includes('create') || lower.includes('add') || lower.includes('make') || lower.includes('show'))) {
    
    // Determine chart type (default to bar if not specified)
    let chartType = 'barChart';
    for (const [keyword, type] of Object.entries(chartTypes)) {
      if (lower.includes(keyword)) {
        chartType = type;
        break;
      }
    }
    
    const commands: any[] = [{
      action: 'addVisualization',
      params: { type: chartType, title: 'New Chart' }
    }];
    
    // Check if a table/data source is mentioned
    const tableName = extractTableName(input);
    
    if (tableName) {
      // Add a bindData command to connect the chart to the data
      commands.push({
        action: 'binddata',
        target: { selector: '#last' },
        params: { table: tableName }
      });
    }
    
    return { commands };
  }
  
  // Specific chart type detection
  for (const [keyword, chartType] of Object.entries(chartTypes)) {
    if (lower.includes(keyword) && (lower.includes('chart') || lower.includes('graph'))) {
      const commands: any[] = [{
        action: 'addVisualization',
        params: { type: chartType, title: `${keyword} chart` }
      }];
      
      // Check if a table/data source is mentioned
      const tableName = extractTableName(input);
      
      if (tableName) {
        // Add a bindData command to connect the chart to the data
        commands.push({
          action: 'binddata',
          target: { selector: '#last' },
          params: { table: tableName }
        });
      }
      
      return { commands };
    }
  }
  
  // Shape detection
  const shapes = ['rectangle', 'circle', 'triangle', 'square', 'oval'];
  for (const shape of shapes) {
    if (lower.includes(shape)) {
      return {
        commands: [{
          action: 'addElement',
          params: { 
            type: 'shape', 
            shape: shape === 'square' ? 'rectangle' : shape,
            fill: '#3B82F6'
          }
        }]
      };
    }
  }
  
  // Layout commands
  if (lower.includes('arrange') && lower.includes('grid')) {
    return { commands: [{ action: 'arrangeGrid' }] };
  }
  
  if (lower.includes('align')) {
    const alignment = lower.includes('left') ? 'left' :
                     lower.includes('right') ? 'right' :
                     lower.includes('top') ? 'top' :
                     lower.includes('bottom') ? 'bottom' : 'left';
    return { 
      commands: [{ 
        action: 'align',
        params: { alignment }
      }]
    };
  }
  
  if (lower.includes('distribute') || lower.includes('space')) {
    return {
      commands: [{
        action: 'distribute',
        params: { direction: lower.includes('vertical') ? 'vertical' : 'horizontal' }
      }]
    };
  }
  
  // Movement commands
  if (lower.includes('move')) {
    const direction = lower.includes('left') ? { dx: -50, dy: 0 } :
                     lower.includes('right') ? { dx: 50, dy: 0 } :
                     lower.includes('up') ? { dx: 0, dy: -50 } :
                     lower.includes('down') ? { dx: 0, dy: 50 } : { dx: 0, dy: 0 };
    return {
      commands: [{
        action: 'moveItem',
        target: { selector: '@selected' },
        params: direction
      }]
    };
  }
  
  // Size commands
  if (lower.includes('bigger') || lower.includes('larger')) {
    return {
      commands: [{
        action: 'resizeItem',
        target: { selector: '@selected' },
        params: { width: 600, height: 400 }
      }]
    };
  }
  
  if (lower.includes('smaller') || lower.includes('tiny')) {
    return {
      commands: [{
        action: 'resizeItem',
        target: { selector: '@selected' },
        params: { width: 200, height: 150 }
      }]
    };
  }
  
  // GIF detection
  if (lower.includes('gif')) {
    const searchMatch = input.match(/(?:add|insert|place|put)\s*(?:a|an|the)?\s*(.+?)\s*gif/i);
    if (searchMatch) {
      const searchTerm = searchMatch[1].trim();
      return {
        commands: [{
          action: 'addElement',
          params: { type: 'gif', search: searchTerm }
        }]
      };
    }
  }
  
  // Data binding commands
  if ((lower.includes('connect') || lower.includes('bind') || lower.includes('link')) && 
      (lower.includes('data') || lower.includes('table') || lower.includes('to'))) {
    const tableName = extractTableName(input);
    if (tableName) {
      return {
        commands: [{
          action: 'binddata',
          target: { selector: '@selected' },
          params: { table: tableName }
        }]
      };
    }
  }
  
  // Delete commands
  if (lower.includes('delete') || lower.includes('remove')) {
    if (lower.includes('everything') || lower.includes('all')) {
      return { commands: [{ action: 'clearCanvas' }] };
    }
    return {
      commands: [{
        action: 'removeItem',
        target: { selector: '@selected' }
      }]
    };
  }
  
  // Data canvas navigation
  if (lower.includes('data canvas') || lower.includes('data mode')) {
    return { commands: [{ action: 'navigateDataCanvas' }] };
  }
  
  if (lower.includes('design mode') || lower.includes('design canvas')) {
    return { commands: [{ action: 'switchToDesign' }] };
  }
  
  // Background color changes
  if (lower.includes('background')) {
    // Common color names
    const colorMap: Record<string, string> = {
      'blue': '#3B82F6',
      'red': '#EF4444',
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'orange': '#F97316',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#6B7280',
      'grey': '#6B7280'
    };
    
    // Check for color names
    for (const [colorName, colorValue] of Object.entries(colorMap)) {
      if (lower.includes(colorName)) {
        return {
          commands: [{
            action: 'setBackground',
            params: { type: 'color', value: colorValue }
          }]
        };
      }
    }
    
    // Check for hex colors
    const hexMatch = input.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/);
    if (hexMatch) {
      return {
        commands: [{
          action: 'setBackground',
          params: { type: 'color', value: hexMatch[0] }
        }]
      };
    }
  }
  
  // No match - return null to fallback to AI
  return null;
}

/**
 * Test if command should use local parser
 */
export function shouldUseLocalParser(input: string): boolean {
  const lower = input.toLowerCase();
  
  // Simple commands that should bypass AI
  const localPatterns = [
    'emoji', 'text', 'chart', 'graph', 'shape',
    'rectangle', 'circle', 'triangle',
    'arrange', 'align', 'distribute',
    'move', 'bigger', 'smaller',
    'delete', 'remove', 'background',
    'connect', 'bind', 'link', 'visualization'
  ];
  
  return localPatterns.some(pattern => lower.includes(pattern));
}