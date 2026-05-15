export interface ActionCall {
  name: string;
  args: any[];
}

export function extractActionParams(actionString: string): ActionCall | null {
  let cleanStr = actionString.trim();
  
  // 0. Handle JSON format (fallback)
  if (cleanStr.startsWith('{') && cleanStr.endsWith('}')) {
    try {
      const obj = JSON.parse(cleanStr);
      if (obj.action) {
        // Normalize keys
        const args: any[] = [];
        if (Array.isArray(obj.element)) args.push(...obj.element);
        if (Array.isArray(obj.start)) args.push(...obj.start);
        if (Array.isArray(obj.end)) args.push(...obj.end);
        if (obj.app) args.push(obj.app);
        if (obj.text) args.push(obj.text);
        if (obj.duration) args.push(obj.duration);
        
        return { name: obj.action, args };
      }
    } catch (e) {
      // ignore
    }
  }

  // 1. Remove wrapping do(...)
  // Handle do(action=...) or do (action=...) or do（action=...）
  if (cleanStr.toLowerCase().startsWith("do")) {
    const openParenIndex = cleanStr.search(/[(\uff08]/);
    if (openParenIndex !== -1) {
      cleanStr = cleanStr.slice(openParenIndex + 1);
      // Remove last ) or ）
      if (cleanStr.endsWith(")") || cleanStr.endsWith("\uff09")) {
        cleanStr = cleanStr.slice(0, -1);
      }
    } else {
      return null;
    }
  } else {
    // If it doesn't start with do, maybe it's just the content? 
    // But safely return null if unsure, or try to parse anyway if it looks like key-values.
    // For now, assume strict format.
    return null;
  }

  // 2. Parse key-values
  // Regex to capture key="value" or key='value' or key=[1,2]
  // Also supports Chinese quotes “...” and ‘...’
  // We'll allow spaces around =
  const params: Record<string, any> = {};
  
  // Regex explanation:
  // ([a-zA-Z0-9_]+)   : Capture key
  // \s*=\s*           : Equal sign with optional whitespace
  // (                 : Value group
  //   "([^"]*)"       : Double quoted string
  //   |
  //   '([^']*)'       : Single quoted string
  //   |
  //   “([^”]*?)”      : Chinese double quoted string
  //   |
  //   ‘([^’]*?)’      : Chinese single quoted string
  //   |
  //   \[([\d\s,]+)\]  : Array of numbers [1, 2]
  // )
  const regex = /([a-zA-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|“([^”]*?)”|‘([^’]*?)’|\[([\d\s,]+)\])/g;
  
  let match;
  let found = false;
  while ((match = regex.exec(cleanStr)) !== null) {
    found = true;
    const key = match[1];
    const strValDouble = match[2];
    const strValSingle = match[3];
    const strValChineseDouble = match[4];
    const strValChineseSingle = match[5];
    const arrVal = match[6];
    
    if (arrVal !== undefined) {
      // Parse [1,2]
      params[key] = arrVal.split(',').map(n => {
        const num = Number(n.trim());
        return isNaN(num) ? 0 : num;
      });
    } else {
      params[key] = strValDouble ?? strValSingle ?? strValChineseDouble ?? strValChineseSingle ?? "";
    }
  }
  
  if (!found) return null;
  
  // 3. Extract action name
  let rawName = params['action'];
  if (!rawName) return null;
  
  // 4. Normalize and map to args
  const name = String(rawName);
  const normalized = name.toLowerCase().replace(/ /g, '_'); // "Double Tap" -> "double_tap"
  
  // Helper to find array params with fallbacks
  const getArrayParam = (keys: string[]) => {
    for (const k of keys) {
      const val = params[k];
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val)) return val;
        return [val];
      }
    }
    return [];
  };

  // Mapping based on SYSTEM_PROMPT definitions
  switch (normalized) {
    case 'tap':
    case 'click':
      return { name: 'click', args: getArrayParam(['element', 'point', 'pos', 'args']) };
    case 'double_tap':
    case 'double_click':
      return { name: 'double_click', args: getArrayParam(['element', 'point', 'pos', 'args']) };
    case 'long_press':
      return { name: 'long_press', args: getArrayParam(['element', 'point', 'pos', 'args']) };
    case 'swipe':
      let start = params['start_id'] || params['start'];
      let end = params['end_id'] || params['end'];
      
      // Handle ID-based swipe (Independent Mode)
      if (start && end) {
         // Ensure they are in an array
         const startArr = Array.isArray(start) ? start : [start];
         const endArr = Array.isArray(end) ? end : [end];
         return { name: 'swipe', args: [...startArr, ...endArr] };
      }

      // If we are here, at least one is missing.
      // Normalize to arrays for fallback logic
      const s = start ? (Array.isArray(start) ? start : [start]) : [];
      const e = end ? (Array.isArray(end) ? end : [end]) : [];

      // Fallback: Check if direction/distance is provided (e.g. from Planner output)
      // Default screen size assumption: 1000x1000
      if ((s.length === 0 || e.length === 0)) {
        // Try to extract from 'args' or specific keys
        let dir = params['direction'] || params['dir'] || '';
        let dist = params['distance'] || params['dist'] || 'short';
        
        // If args is present, maybe it contains ["DOWN", "LONG"]
        // Our regex currently only supports number arrays [1,2]. String arrays ["A","B"] are not captured by arrVal regex.
        // But the key-value parser might capture args="DOWN, LONG" if no brackets, or fail.
        
        // If we found a direction string in values
        if (!dir) {
          // iterate all params to find something that looks like UP/DOWN/LEFT/RIGHT
          for (const [k, val] of Object.entries(params)) {
             if (typeof val === 'string' && /^(UP|DOWN|LEFT|RIGHT)$/i.test(val)) {
                dir = val;
                // Check if another param has LONG/SHORT
                for (const val2 of Object.values(params)) {
                   if (typeof val2 === 'string' && /^(LONG|SHORT)$/i.test(val2)) {
                      dist = val2;
                      break;
                   }
                }
                break;
             }
          }
        }
        
        if (dir) {
           const d = dir.toUpperCase();
           const isLong = String(dist).toUpperCase().includes('LONG');
           const delta = isLong ? 600 : 300;
           const cx = 500;
           const cy = 500;
           
           // UP: Scroll down content (finger moves UP) -> start low, end high
           // start=[500, 800], end=[500, 200]
           if (d === 'UP') return { name: 'swipe', args: [cx, cy + delta/2, cx, cy - delta/2] };
           
           // DOWN: Scroll up content (finger moves DOWN) -> start high, end low
           // start=[500, 200], end=[500, 800]
           if (d === 'DOWN') return { name: 'swipe', args: [cx, cy - delta/2, cx, cy + delta/2] };
           
           // LEFT: Next page (finger moves LEFT) -> start right, end left
           // start=[800, 500], end=[200, 500]
           if (d === 'LEFT') return { name: 'swipe', args: [cx + delta/2, cy, cx - delta/2, cy] };
           
           // RIGHT: Prev page (finger moves RIGHT) -> start left, end right
           // start=[200, 500], end=[800, 500]
           if (d === 'RIGHT') return { name: 'swipe', args: [cx - delta/2, cy, cx + delta/2, cy] };
        }
      }
      
      // Flatten start and end to [sx, sy, ex, ey]
      return { name: 'swipe', args: [...s, ...e] };
    case 'launch':
      return { name: 'launch', args: [params['app']] };
    case 'type':
    case 'type_name':
      return { name: 'input', args: [params['text']] };
    case 'wait':
      const durStr = params['duration'] || "1";
      // Extract number from "2 seconds"
      const durMatch = String(durStr).match(/([\d.]+)/);
      const dur = durMatch ? parseFloat(durMatch[1]) : 1;
      return { name: 'wait', args: [dur] };
    case 'back':
      return { name: 'back', args: [] };
    case 'home':
      return { name: 'home', args: [] };
    case 'take_over':
      return { name: 'take_over', args: [] };
    default:
      // Fallback for unknown actions? 
      // Maybe return null or pass through?
      return null;
  }
}
