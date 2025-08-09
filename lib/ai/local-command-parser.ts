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
  
  // Chart detection
  const chartTypes = {
    'bar': 'barChart',
    'line': 'lineChart',
    'pie': 'pieChart',
    'area': 'areaChart',
    'scatter': 'scatterPlot'
  };
  
  for (const [keyword, chartType] of Object.entries(chartTypes)) {
    if (lower.includes(keyword) && (lower.includes('chart') || lower.includes('graph'))) {
      return {
        commands: [{
          action: 'addVisualization',
          params: { type: chartType, title: `${keyword} chart` }
        }]
      };
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
    'delete', 'remove'
  ];
  
  return localPatterns.some(pattern => lower.includes(pattern));
}