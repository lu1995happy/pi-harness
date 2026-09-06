import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

// Owned terminal adaptation of the supplied references. No browser renderer.
export const ink={cyan:'\x1b[38;2;100;211;229m',purple:'\x1b[38;2;190;166;230m',pink:'\x1b[38;2;225;158;206m',gold:'\x1b[38;2;245;211;114m',muted:'\x1b[38;2;151;160;185m',text:'\x1b[38;2;217;223;237m',edge:'\x1b[38;2;78;82;116m',green:'\x1b[38;2;145;209;166m',reset:'\x1b[0m'};
const fill='\x1b[48;2;39;43;64m';
export const paint=(color:string,text:string)=>color+text+ink.reset;
function surface(text:string,width:number,background=fill){
  // Normalize upstream panel backgrounds, preserve Markdown foreground and OSC markers.
  const content=truncateToWidth(text.replace(/\x1b\[(?:48;[25];[\d;]+|49)m/g,'').replace(/\x1b\[0m/g,ink.reset+background+ink.text),width);
  return background+ink.text+content+' '.repeat(Math.max(0,width-visibleWidth(content)))+ink.reset;
}
export function panel(lines:string[],width:number,label='',accent=ink.cyan){
  if(width<8)return lines.map(line=>truncateToWidth(line,width));
  let start='',end='';
  const body=lines.map(line=>line.replace(/\x1b\]133;([ABC])\x07/g,(marker,kind)=>{if(kind==='A')start+=marker;else end+=marker;return '';}));
  const empty=(line:string)=>!line.replace(/\x1b\[[\d;]*m/g,'').trim();
  while(body.length&&empty(body[0]))body.shift();
  while(body.length&&empty(body.at(-1)!))body.pop();
  const trimmed=body.length===1?body[0].replace(/ +(?=(?:\x1b\[[\d;]*m)*$)/,'').replace(/^((?:\x1b\[[\d;]*m)*) +/,'$1'):'';
  const compact=label==='LAST USER PROMPT'&&body.length===1&&visibleWidth(trimmed)+label.length+6<=width;
  if(compact)body[0]=paint(ink.cyan,label)+'  '+trimmed;
  else if(label)body.unshift(paint(accent,label));
  let code=false;
  const edge=(text:string,color=ink.edge)=>fill+color+text+ink.reset;
  const rendered=[edge('╭',accent)+edge('─'.repeat(width-2)+'╮'),
    ...body.map(line=>{
      const fence=/^\s*(```|~~~)/.test(line.replace(/\x1b\[[\d;]*m/g,''));
      const background=code||fence?'\x1b[48;2;24;28;43m':fill;
      if(fence)code=!code;
      return edge('│',accent)+surface(' '+line,width-2,background)+edge('│');
    }),
    edge('╰',accent)+edge('─'.repeat(width-2)+'╯')];
  rendered[0]=start+rendered[0];rendered[rendered.length-1]+=end;
  return rendered;
}
export function powerline(width:number,model:string,thinking:string,project:string,branch:string,changes:string,usage:string){
  // Selected palette/icon values from pi-powerline-footer's public design;
  // no font is inferred from terminal brand. Enable Nerd glyphs only explicitly.
  const nerd=process.env.POWERLINE_NERD_FONTS==='1';
  const icons=nerd?['\uE22C','\uEC19','\uF115','\uF126','\uF1C0']:['π','','dir','⎇','◫'];
  const modelColor='\x1b[38;2;215;135;175m',pathColor='\x1b[38;2;0;175;175m',gold='\x1b[38;2;254;188;56m';
  const segments=[paint(gold,icons[0]),paint(modelColor,(icons[1]?icons[1]+' ':'')+model),paint(ink.purple,'thinking:')+paint(gold,thinking),paint(pathColor,icons[2]+' '+project),paint(changes?gold:'\x1b[38;2;137;210;129m',icons[3]+' '+branch+changes),paint(ink.text,icons[4]+' '+usage)];
  const content=truncateToWidth(segments.join(paint(ink.muted,' ❯ ')),Math.max(1,width-5));
  return paint(ink.cyan,'╭ ')+content+paint(ink.cyan,' '+'─'.repeat(Math.max(0,width-4-visibleWidth(content)))+'╮');
}

// Side/end caps instead of Pi's unrelated full-width bottom rule.
export function inputBottom(width:number,hidden=0){
  const label=hidden?` ↓ ${hidden} more `:'';
  const content=truncateToWidth(label,Math.max(0,width-4),'');
  return paint(ink.cyan,'╰─'+content+' '.repeat(Math.max(0,width-4-visibleWidth(content)))+'─╯');
}
