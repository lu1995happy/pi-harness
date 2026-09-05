import path from 'node:path';
import { AssistantMessageComponent, UserMessageComponent, ToolExecutionComponent } from '@earendil-works/pi-coding-agent';
import { truncateToWidth, visibleWidth, Text } from '@earendil-works/pi-tui';
import { installToolGrouping, ToolGroupComponent } from '../components/tool-display/renderer/tool/grouping.ts';
import { setToolTuiFullscreen } from '../components/tool-display/renderer/tool/show-more-hint.ts';
import { installCalm } from '../components/firstmate/calm.ts';
import { maps, readJson, stateRoot } from '../src/store.mjs';
import { config } from '../src/config.mjs';
import { mapsForRepository } from '../src/repository.mjs';
import { visualPages } from '../src/visual-pages.mjs';

const PATCH=Symbol.for('personal-pi-harness:cards');
function installCards() {
  const registry=globalThis as any;if(registry[PATCH])return;registry[PATCH]=true;
  for(const [Component,label] of [[UserMessageComponent,'YOUR PROMPT'],[AssistantMessageComponent,'OUTPUT']] as const){
    const original=Component.prototype.render;
    Component.prototype.render=function(width:number){
      if(width<16)return original.call(this,width);
      const inner=original.call(this,Math.max(1,width-4));
      if(!inner.some(line=>line.trim()))return [];
      // Thinking/tool-use messages are activity, not final response cards.
      if(Component===AssistantMessageComponent&&((this as any).lastMessage?.stopReason==='toolUse'))return inner;
      const cyan='\x1b[38;5;110m',reset='\x1b[0m';
      return [cyan+truncateToWidth(`╭─ ${label} ${'─'.repeat(width)}`,width-1)+'╮'+reset,
        ...inner.map(line=>`${cyan}│${reset} ${truncateToWidth(line,width-4)}${' '.repeat(Math.max(0,width-3-visibleWidth(truncateToWidth(line,width-4))))}${cyan}│${reset}`),
        cyan+`╰${'─'.repeat(width-2)}╯`+reset];
    };
  }
  // Use Pi 0.85's component-local mouse routing rather than the upstream
  // fullscreen screen-coordinate interception. The accepted Herdr conflict remains.
  for(const Component of [ToolExecutionComponent,ToolGroupComponent]){
    const original=Component.prototype.handleMouse;
    (Component.prototype as any).handleMouse=function(event:any){
      if(event.type==='click'&&event.button==='left'){
        this.setExpanded(!(this._expanded??this.expanded));return {handled:true,render:true};
      }
      return original?.call(this,event);
    };
  }
}
export function installUI(pi:any,role:string) {
  let calm=config().calm,ctx:any,timer:any,supervision='starting';
  installCalm(()=>calm);installCards();setToolTuiFullscreen(true);
  const grouping=installToolGrouping(()=>true);
  async function refresh(){
    if(!ctx?.hasUI)return;
    try{
      const all=await mapsForRepository(await maps(),ctx.cwd);
      const rows:string[]=[];
      if(role==='main'){
        rows.push(`◉ Supervision · ${supervision}`);
        for(const map of all.filter(m=>m.status==='active')){
          rows.push(`⚑ ${map.title}`);
          for(const issue of map.issues)rows.push(`  ${issue.status==='merged'?'✓':issue.status==='waiting'?'?':'·'} ${issue.id} · ${issue.title} · ${issue.status}${issue.kind?` · ${issue.kind}`:''}`);
        }
        const pages=await visualPages();
        for(const page of pages.filter((p:any)=>p.status==='waiting'&&all.some(m=>m.id===p.mapId)))rows.push(`◇ Waiting for you · ${page.title}`);
      }
      ctx.ui.setWidget('harness-status',rows);
    }catch(error:any){ctx.ui.setStatus('harness-error',error.message);}
  }
  pi.on('session_start',(_event:any,newCtx:any)=>{
    ctx=newCtx;if(!ctx.hasUI)return;
    ctx.ui.setHiddenThinkingLabel('');ctx.ui.setToolsExpanded(false);grouping.setTheme(ctx.ui.theme);
    ctx.ui.setFooter((tui:any,theme:any,data:any)=>{
      const unsubscribe=data.onBranchChange(()=>tui.requestRender());
      return {dispose:unsubscribe,invalidate(){},render(width:number){
        const usage=ctx.getContextUsage();const model=ctx.model?.id||'no model';
        const segments=[theme.fg('accent','π'),theme.fg('accent',model),theme.fg('muted',`thinking:${pi.getThinkingLevel()}`),theme.fg('accent',path.basename(ctx.cwd)),theme.fg('warning',data.getGitBranch()||'no branch'),theme.fg('dim',usage?`${Math.round(usage.percent||0)}%/${Math.round((ctx.model?.contextWindow||0)/1000)}k`:'context —')];
        return [truncateToWidth(segments.join(theme.fg('dim',' ❯ ')),width)];
      }};
    });
    if(timer)clearInterval(timer);timer=setInterval(()=>void refresh(),1500);timer.unref();void refresh();
  });
  pi.registerCommand('calm',{description:'Toggle middle activity visibility; keep prompt and final output.',handler:async()=>{calm=!calm;ctx.ui.notify(`Calm ${calm?'on':'off'}`,'info');}});
  pi.registerCommand('crew-status',{description:'Refresh supervision, map groups and waiting visual questions.',handler:refresh});
  pi.on('session_shutdown',()=>{if(timer)clearInterval(timer);grouping.shutdown();});
  return (value:string)=>{supervision=value;void refresh();};
}
