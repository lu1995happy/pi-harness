import path from 'node:path';
import { AssistantMessageComponent, UserMessageComponent, ToolExecutionComponent, CustomMessageComponent, CustomEditor } from '@earendil-works/pi-coding-agent';
import { truncateToWidth, matchesKey, Key, Text } from '@earendil-works/pi-tui';
import { installToolGrouping, ToolGroupComponent } from '../components/tool-display/renderer/tool/grouping.ts';
import { setToolTuiFullscreen } from '../components/tool-display/renderer/tool/show-more-hint.ts';
import { installCalm } from '../components/firstmate/calm.ts';
import { maps } from '../src/store.mjs';
import { config } from '../src/config.mjs';
import { mapsForRepository } from '../src/repository.mjs';
import { visualPages } from '../src/visual-pages.mjs';
import {run} from '../src/process.mjs';
import {ink,paint,panel,powerline,inputBottom} from '../components/firstmate/presentation.ts';
import {rolePresentation} from '../src/roles.mjs';
import {installRegularInteraction} from '../components/firstmate/regular-interaction.ts';

const PATCH=Symbol.for('personal-pi-harness:cards');
function installCards() {
  const registry=globalThis as any;
  if(registry[PATCH]?.update){registry[PATCH].update(panel);return;}
  const state={panel,update(next:any){this.panel=next;}};registry[PATCH]=state;
  for(const [Component,label] of [[UserMessageComponent,'LAST USER PROMPT'],[AssistantMessageComponent,''],[CustomMessageComponent,'EXTENSION OUTPUT']] as const){
    const original=Component.prototype.render;
    Component.prototype.render=function(width:number){
      if(width<16)return original.call(this,width);
      const inner=original.call(this,Math.max(1,width-4));
      if(!inner.some(line=>line.trim()))return [];
      return state.panel(inner,width,label,Component===CustomMessageComponent?ink.purple:Component===AssistantMessageComponent?ink.pink:ink.cyan);
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
  let calm=config().calm,ctx:any,timer:any,supervision='starting',branch='no branch',changes='',renderTui:any,refreshing=false;
  let interaction:any;
  installCalm(()=>calm);installCards();setToolTuiFullscreen(false);
  const grouping=installToolGrouping(()=>true);
  async function refresh(){
    if(!ctx?.hasUI||refreshing)return;refreshing=true;
    try{
      const all=await mapsForRepository(await maps(),ctx.cwd);
      const rows:string[]=[];
      if(role==='main'){
        rows.push(paint(ink.cyan,'◉ SUPERVISION')+paint(ink.muted,`  ${supervision}`));
        for(const map of all.filter(m=>m.status==='active')){
          rows.push(paint(ink.purple,`╭─ CREW · ${map.title}`));
          for(const issue of map.issues)rows.push(paint(ink.edge,'│ ')+paint(issue.status==='merged'?ink.green:issue.status==='waiting'?ink.gold:ink.cyan,`${issue.status==='merged'?'✓':issue.status==='waiting'?'?':'·'} ${issue.id}`)+` · ${issue.title}`+paint(ink.muted,` · ${issue.status}${issue.kind?` · ${issue.kind}`:''}`));
          rows.push(paint(ink.edge,'╰─'));
        }
        const pages=await visualPages();
        for(const page of pages.filter((p:any)=>p.status==='waiting'&&all.some(m=>m.id===p.mapId)))rows.push(paint(ink.gold,`◇ WAITING FOR YOU · ${page.title}`));
      }
      if(rolePresentation(role).team)ctx.ui.setWidget('harness-status',rows);
      const status=await run('git',['--no-optional-locks','status','--porcelain=v1','-z','--branch'],{cwd:ctx.cwd,timeout:3000,allowFailure:true});
      if(status.code===0){
        const entries=status.stdout.split('\0');const header=entries.shift()||'';
        branch=header.replace(/^## (?:No commits yet on |Initial commit on )?/,'').split('...')[0];
        let dirty=0,untracked=0;
        for(let i=0;i<entries.length;i++){const entry=entries[i];if(!entry)continue;if(entry.startsWith('??'))untracked++;else{dirty++;if(/[RC]/.test(entry.slice(0,2)))i++;}}
        changes=(dirty?` *${dirty}`:'')+(untracked?` ?${untracked}`:'');
      }else{branch='no branch';changes='';}
      renderTui?.requestRender();
    }catch(error:any){ctx.ui.setStatus('harness-error',error.message);}finally{refreshing=false;}
  }
  pi.on('session_start',(_event:any,newCtx:any)=>{
    ctx=newCtx;if(!ctx.hasUI)return;
    ctx.ui.setWidget('harness-last-prompt',undefined);
    ctx.ui.setHiddenThinkingLabel('');ctx.ui.setToolsExpanded(false);grouping.setTheme(ctx.ui.theme);
    ctx.ui.setEditorComponent((tui:any,theme:any,keybindings:any)=>{
      renderTui=tui;
      interaction?.dispose();interaction=installRegularInteraction(tui,(message:string)=>ctx.ui.setStatus('harness-sticky',message||undefined));
      // Retain Pi's application shortcuts, paste handling, completion and cursor layout.
      const editor=new CustomEditor(tui,theme,keybindings);
      const original=editor.renderTopBorder.bind(editor);
      editor.renderTopBorder=(width:number,hidden:number)=>{
        width+=2;
        if(hidden>0||width<24)return paint(ink.cyan,'╭')+original(width-2,hidden)+paint(ink.cyan,'╮');
        const usage=ctx.getContextUsage();
        return powerline(width,ctx.model?.name||ctx.model?.id||'no model',pi.getThinkingLevel(),path.basename(ctx.cwd),branch,changes,usage?`${Math.round(usage.percent||0)}%/${Math.round((ctx.model?.contextWindow||0)/1000)}k`:'context —');
      };
      let moreBelow=0;
      editor.renderBottomBorder=(width:number,hidden:number)=>{moreBelow=hidden;return inputBottom(width+2,hidden);};
      const render=editor.render.bind(editor),mouse=editor.handleMouse.bind(editor);
      editor.render=(width:number)=>{
        if(width<4)return [''];
        const rows=render(width-2),bottom=(editor as any).renderedVisibleLineCount+1;
        return rows.flatMap((line:string,index:number)=>index===bottom?(moreBelow?[line]:[]):index===0?[line]:index<bottom?[paint(ink.cyan,index===bottom-1?'╰':'│')+line+paint(ink.cyan,index===bottom-1?'╯':'│')]:[' '+line+' ']);
      };
      editor.handleMouse=(event:any)=>mouse({...event,x:Math.max(0,event.x-1),y:!moreBelow&&event.y>(editor as any).renderedVisibleLineCount?event.y+1:event.y,width:Math.max(1,event.width-2)});
      return editor;
    });
    ctx.ui.setFooter(()=>({invalidate(){},render(){return [];}}));
    if(timer)clearInterval(timer);timer=setInterval(()=>void refresh(),1500);timer.unref();void refresh();
  });
  pi.registerCommand('calm',{description:'Toggle middle activity visibility; keep prompt and final output.',handler:async()=>{calm=!calm;ctx.ui.notify(`Calm ${calm?'on':'off'}`,'info');}});
  pi.registerCommand('harness-mouse',{description:'Toggle temporary tool-click capture; Escape or the wheel restores native mouse behavior.',handler:async()=>{
    const enabled=interaction?.toggleMouse();
    ctx?.ui.notify(enabled?'Tool clicks enabled. Escape or wheel releases mouse capture.':'Native terminal mouse behavior restored.','info');
  }});
  if(rolePresentation(role).team)pi.registerCommand('crew-status',{description:'Refresh supervision, map groups and waiting visual questions.',handler:refresh});
  pi.registerEntryRenderer('harness-interaction-fixture',(_entry:any,_options:any,theme:any)=>{
    const group=new ToolGroupComponent({groups:new Set(),theme,active:false} as any);
    group.addTool({toolName:'bash',args:{command:'echo interaction-check'},result:{isError:false},render:()=>['echo interaction-check','INTERACTION CHECK DETAILS VISIBLE']});
    return group;
  });
  pi.registerEntryRenderer('harness-scroll-fixture',()=>new Text(Array.from({length:45},(_,i)=>`Synthetic scroll fixture ${i+1}`).join('\n'),0,0));
  pi.registerEntryRenderer('harness-cards-fixture',()=>{
    const prompt=new UserMessageComponent('Review the map and show me the result.');
    const reply=new AssistantMessageComponent({role:'assistant',content:[{type:'text',text:'The map is ready for **review**.\n\n- Crew changes merged\n- Independent review passed'}],stopReason:'stop'} as any);
    return {mouseLayout:undefined as any,invalidate(){prompt.invalidate();reply.invalidate();},render(width:number){const p=prompt.render(width),r=reply.render(width);this.mouseLayout={width,children:[{component:prompt,height:p.length},{component:reply,height:r.length}]};return [...p,...r,...panel(['Review report saved.'],width,'EXTENSION OUTPUT',ink.purple)];}};
  });
  pi.registerCommand('harness-cards-check',{description:'Render synthetic prompt, reply, and extension cards in normal scrollback.',handler:async()=>{pi.appendEntry('harness-cards-fixture',{});}});
  pi.registerCommand('harness-interaction-check',{description:'Render a synthetic tool activity fixture without calling a model.',handler:async(args:string)=>{

    if(args.trim()==='long')pi.appendEntry('harness-scroll-fixture',{});
    pi.appendEntry('harness-interaction-fixture',{});
  }});
  pi.registerCommand('harness-style-preview',{description:'Preview terminal styling with synthetic content; no model call.',handler:async(_args:any,c:any)=>{
    if(c.mode!=='tui')return;
    await c.ui.custom((tui:any,_theme:any,_keys:any,done:any)=>{
      let page=0;
      const group=new ToolGroupComponent({groups:new Set(),theme:_theme,active:false} as any);
      for(const [toolName,args,result] of [['bash',{command:'sleep 2 && echo done'},undefined],['read',{path:'README.md'},{isError:false}],['read',{path:'missing.ts'},{isError:true}],['read',{path:'package.json'},{isError:false}]] as any[]){group.addTool({toolName,args,result,executionStarted:true,render:(w:number)=>[truncateToWidth(`${toolName}: ${Object.values(args).join(' ')}`,w),truncateToWidth('  Synthetic tool output for expansion preview.',w)]});}
      const prompt=new UserMessageComponent('Review the map and show me the result.');
      const reply=new AssistantMessageComponent({role:'assistant',content:[{type:'text',text:'The map is ready for **final review**.\n\n- Crew changes merged\n- Independent review passed\n\n```sh\ngit diff main...HEAD --stat\n```'}],stopReason:'stop'} as any);
      return {invalidate(){prompt.invalidate();reply.invalidate();},handleInput(key:string){if(matchesKey(key,Key.escape)||matchesKey(key,Key.enter))done(undefined);else if(matchesKey(key,Key.tab)){page=1-page;tui.requestRender();}else if(matchesKey(key,Key.space)){group.setExpanded(!group.expanded);tui.requestRender();}},render(available:number){
        const width=_args.trim()==='narrow'?Math.min(48,available):available;
        const content=page===0?[...prompt.render(width),...reply.render(width),...panel(['Review report saved. No publication has run.'],width,'EXTENSION OUTPUT',ink.purple)]:[...group.render(width),'',paint(ink.cyan,'◉ SUPERVISION')+paint(ink.muted,'  watching · 3 crews'),paint(ink.purple,'╭─ CREW · Account settings'),paint(ink.cyan,'│ ▸ #12 · Profile form · working · Pi'),paint(ink.gold,'│ ? #13 · Avatar upload · waiting · Claude Code'),paint(ink.green,'│ ✓ #14 · Tests · merged · Codex'),paint(ink.edge,'╰─'),paint(ink.gold,'◇ WAITING FOR YOU · Choose the settings layout'),''];
        return [truncateToWidth(paint(ink.muted,'STYLE PREVIEW · synthetic · Tab: panels/tools · Space: expand · Enter/Esc: close'),width),...content,powerline(width,'Opus 4.5','high','pi-mono','main',' *10 ?2','0.0%/200k')];
      }};
    });
  }});
  pi.on('session_shutdown',()=>{if(timer)clearInterval(timer);interaction?.dispose();grouping.shutdown();});
  return (value:string)=>{supervision=value;void refresh();};
}
