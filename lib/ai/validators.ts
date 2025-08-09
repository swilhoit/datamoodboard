export function validateCommands(commands: any[]): string | null {
  for (const c of commands) {
    if (!c || typeof c !== 'object') return 'Invalid command object'
    if (!c.action || typeof c.action !== 'string') return 'Command.action is required'
    const a = c.action.toLowerCase()
    const allowed = [
      'addvisualization',
      'updateitem',
      'removeitem',
      'moveitem',
      'resizeitem',
      'binddata',
      'arrangelayout',
      'settheme',
      'listdatasets',
      // Canvas intelligence commands
      'findspace',
      'findemptyspace',
      'placenear',
      'arrangegrid',
      'align',
      'distribute',
      'createpipeline',
      'getanalytics',
      'finditems',
      // Additional navigation
      'connectnodes',
      'createdataflow',
      'groupitems',
      'findoverlaps',
    ]
    if (!allowed.includes(a)) return `Unsupported action: ${c.action}`
  }
  return null
}

export function applyValidationGuards(action: string, cmd: any, state: any) {
  const a = action.toLowerCase()
  if (a === 'resizeitem') {
    if (cmd?.params?.width && (cmd.params.width < 100 || cmd.params.width > 2000)) {
      cmd.params.width = Math.max(100, Math.min(2000, Number(cmd.params.width)))
    }
    if (cmd?.params?.height && (cmd.params.height < 80 || cmd.params.height > 1200)) {
      cmd.params.height = Math.max(80, Math.min(1200, Number(cmd.params.height)))
    }
  }
  if (a === 'addvisualization') {
    const count = (state.canvasItems || []).length
    if (count > 200) {
      throw new Error('Too many items on canvas')
    }
  }
}


