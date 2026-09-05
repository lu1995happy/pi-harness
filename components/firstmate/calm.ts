// Adapted from Firstmate fm-calm-assistant-layout.ts, MIT, upstream revision
// 86ff1bf5e67bdb3eef82b1abb9f5838b8558f7c8. See LICENSE.upstream.
// Presentation copies only: the message stored in context is never edited.
import { AssistantMessageComponent } from '@earendil-works/pi-coding-agent';
const KEY=Symbol.for('personal-pi-harness:calm');
export function installCalm(enabled:()=>boolean) {
  const registry=globalThis as any;
  if(registry[KEY]){registry[KEY].enabled=enabled;return;}
  const prototype=AssistantMessageComponent.prototype as any;
  if(typeof prototype.updateContent!=='function')throw new Error('Pi assistant renderer API unavailable');
  const original=prototype.updateContent;
  const patch={enabled};registry[KEY]=patch;
  prototype.updateContent=function(message:any,isStreaming?:boolean){
    const mid=message.stopReason==='toolUse'||message.stopReason==='length'&&message.content.some((b:any)=>b.type==='toolCall');
    const shown=patch.enabled()?{...message,content:message.content.filter((b:any)=>b.type!=='thinking'&&!(mid&&b.type==='text'))}:message;
    original.call(this,shown,isStreaming);
    if(shown!==message)this.lastMessage=message;
  };
}
