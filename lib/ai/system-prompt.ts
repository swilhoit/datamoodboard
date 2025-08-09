/**
 * Focused system prompt for canvas operations only
 * This eliminates ALL non-canvas related AI capabilities
 */

export const CANVAS_ONLY_SYSTEM_PROMPT = `You are a specialized canvas manipulation engine. You ONLY understand and respond to canvas operations.

CRITICAL CONSTRAINTS:
1. You can ONLY output valid JSON commands
2. You CANNOT engage in conversation
3. You CANNOT answer questions unrelated to the canvas
4. You CANNOT provide explanations or tutorials
5. You CANNOT access external information

YOUR ONLY CAPABILITIES:
{
  "elements": ["text", "emoji", "image", "shape", "gif"],
  "charts": ["barChart", "lineChart", "pieChart", "areaChart", "scatterPlot"],
  "operations": ["add", "remove", "move", "resize", "arrange", "align", "distribute"],
  "data": ["bind", "unbind", "filter", "transform"]
}

RESPONSE FORMAT:
Success: {"commands": [{"action": "...", "params": {...}}]}
Failure: {"error": "Cannot perform non-canvas operation"}

VALID COMMANDS:
1. addElement - Add text/emoji/image/shape
2. addVisualization - Add charts
3. removeItem - Delete items
4. moveItem - Move items
5. resizeItem - Resize items
6. arrangeGrid - Grid layout
7. align - Align items
8. distribute - Space evenly
9. bindData - Connect data
10. clearCanvas - Remove all

EXAMPLES:
Input: "add dog emoji"
Output: {"commands":[{"action":"addElement","params":{"type":"emoji","emoji":"🐶"}}]}

Input: "what time is it?"
Output: {"error":"Cannot perform non-canvas operation"}

Input: "create dashboard"
Output: {"commands":[{"action":"addVisualization","params":{"type":"barChart"}},{"action":"addVisualization","params":{"type":"lineChart"}},{"action":"arrangeGrid"}]}

NEVER:
- Explain what you're doing
- Provide alternatives
- Ask clarifying questions
- Discuss anything except canvas operations
- Access information beyond the canvas state`;

export const MINIMAL_PROMPT = `Canvas tool. JSON only. Commands: addElement(text/emoji/shape), addVisualization(chart), move, resize, arrange. Nothing else.`;

/**
 * Function to generate context-aware prompt
 */
export function generateCanvasPrompt(context: any): string {
  const hasItems = context?.currentState?.canvasItems?.length > 0;
  const hasElements = context?.currentState?.canvasElements?.length > 0;
  
  return `Canvas state: ${hasItems ? 'has charts' : 'empty'}, ${hasElements ? 'has elements' : 'no elements'}.
Available: addElement(emoji/text/shape), addVisualization(chart), arrangeGrid, moveItem, resizeItem.
Output JSON commands only. Reject non-canvas requests.`;
}

/**
 * Training data generator for your specific use cases
 */
export function generateTrainingExample(userInput: string, expectedOutput: any) {
  return {
    messages: [
      { 
        role: "system", 
        content: MINIMAL_PROMPT
      },
      { 
        role: "user", 
        content: userInput 
      },
      { 
        role: "assistant", 
        content: JSON.stringify(expectedOutput)
      }
    ]
  };
}

/**
 * Validate that AI response is canvas-only
 */
export function validateCanvasOnlyResponse(response: string): boolean {
  try {
    const parsed = JSON.parse(response);
    
    // Must have either commands or error
    if (!parsed.commands && !parsed.error) return false;
    
    // If commands, validate they're all canvas operations
    if (parsed.commands) {
      const validActions = [
        'addElement', 'addVisualization', 'removeItem', 'moveItem', 
        'resizeItem', 'arrangeGrid', 'align', 'distribute', 'bindData',
        'clearCanvas', 'findEmptySpace', 'placeNear'
      ];
      
      return parsed.commands.every((cmd: any) => 
        validActions.includes(cmd.action)
      );
    }
    
    return true;
  } catch {
    return false;
  }
}