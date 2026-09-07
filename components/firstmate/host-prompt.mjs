import {Resvg} from '@resvg/resvg-js';
import {herdrRequest} from '../../src/herdr-rpc.mjs';
const xml=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function stickySvg(text,width,height){
  const size=Math.max(10,Math.round(height*.30));
  const label='LAST USER PROMPT';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><clipPath id="clip"><rect x="12" y="2" width="${Math.max(1,width-24)}" height="${height-4}" rx="8"/></clipPath></defs><rect x="1" y="1" width="${width-2}" height="${height-2}" rx="9" fill="#272b40" stroke="#4e5274"/><rect x="1" y="7" width="3" height="${height-14}" rx="1.5" fill="#64d3e5"/><text clip-path="url(#clip)" x="14" y="${height*.63}" font-family="JetBrains Mono, Menlo, Consolas, monospace" font-size="${size}" fill="#d9dfed"><tspan fill="#64d3e5" font-weight="bold">${label}</tspan><tspan dx="18">${xml(text.replace(/[\x00-\x1f\x7f]/g,' '))}</tspan></text></svg>`;
}
export function promptAbove(prompts,viewportTop){
  return prompts.filter(p=>p.bottom<=viewportTop).at(-1);
}
export function installHostPrompt(tui,getPrompts,onStatus=()=>{},request=herdrRequest){
  const pane_id=process.env.HERDR_PANE_ID;
  if(!pane_id||!process.env.HERDR_SOCKET_PATH)return {dispose(){},get offset(){return 0;},get active(){return false;}};
  const layer_id='firstmate-sticky-prompt';
  let stopped=false,busy=false,drawn=false,key='',offset=0,retryAt=0;
  async function clear(){if(drawn){await request('pane.graphics.clear',{pane_id,layer_id});drawn=false;key='';}}
  async function update(){
    if(stopped||busy||Date.now()<retryAt)return;busy=true;
    try{
      const state=await request('pane.get',{pane_id});
      if(stopped)return;
      offset=state.pane.scroll?.offset_from_bottom||0;
      const top=(tui.previousViewportTop||0)-offset;
      const prompt=promptAbove(getPrompts(),top);
      if(!prompt||tui.getTopmostVisibleOverlay?.()){await clear();return;}
      const nextKey=JSON.stringify([prompt.text,tui.terminal.columns,tui.terminal.rows]);
      if(nextKey===key)return;
      const info=await request('pane.graphics.info',{pane_id});
      if(stopped)return;
      if(!info.pane_visible)return;
      const columns=Math.max(8,tui.terminal.columns),rows=3;
      const width=columns*info.cell_width_px,height=rows*info.cell_height_px;
      const svg=stickySvg(prompt.text,width,height);
      const png=new Resvg(svg).render().asPng();
      await request('pane.graphics.set',{pane_id,layer_id,z_index:10,format:'png',image_width:width,image_height:height,data_base64:png.toString('base64'),placement:{viewport_col:0,viewport_row:0,grid_cols:columns,grid_rows:rows}});
      drawn=true;key=nextKey;onStatus('');
      if(stopped)await clear();
    }catch(error){retryAt=Date.now()+5000;onStatus(`Sticky prompt unavailable: ${error.message}`);}finally{busy=false;}
  }
  const timer=setInterval(()=>void update(),150);timer.unref();
  const beforeStop=tui.beforeTerminalStop;
  function stop(...args){void clear().catch(()=>{});return beforeStop.apply(this,args);}
  tui.beforeTerminalStop=stop;
  return {get offset(){return offset;},get active(){return drawn;},dispose(){stopped=true;clearInterval(timer);void clear().catch(()=>{});if(tui.beforeTerminalStop===stop)tui.beforeTerminalStop=beforeStop;}};
}
