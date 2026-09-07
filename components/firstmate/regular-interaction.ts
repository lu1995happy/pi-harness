import {UserMessageComponent} from '@earendil-works/pi-coding-agent';
import {ToolGroupComponent} from '../tool-display/renderer/tool/grouping.ts';
import {installMouseCapture} from './mouse-capture.mjs';
import {installHostPrompt} from './host-prompt.mjs';
import {setToolTuiFullscreen} from '../tool-display/renderer/tool/show-more-hint.ts';
export function installRegularInteraction(tui:any,onStatus=(message:string)=>{}){
  function layout(){
    const tools:any[]=[],prompts:any[]=[];
    function visit(node:any,offset:number,height:number){
      if(node instanceof ToolGroupComponent){tools.push({node,row:offset+1});return;}
      if(node instanceof UserMessageComponent){prompts.push({text:node.text,bottom:offset+height});return;}
      let cursor=offset;
      for(const child of node.mouseLayout?.children||[]){visit(child.component,cursor,child.height);cursor+=child.height;}
    }
    visit(tui,0,0);return {tools,prompts};
  }
  const host=installHostPrompt(tui,()=>layout().prompts,onStatus);
  const mouse=installMouseCapture(tui,(row:number)=>{
    if(host.active&&row<3)return;
    return layout().tools.find(tool=>tool.row===row+(tui.previousViewportTop||0)-host.offset)?.node;
  },setToolTuiFullscreen,{defaultEnabled:process.env.HERDR_ENV==='1'});
  return {toggleMouse(){mouse.setEnabled(!mouse.enabled);return mouse.enabled;},dispose(){mouse.dispose();host.dispose();}};
}
