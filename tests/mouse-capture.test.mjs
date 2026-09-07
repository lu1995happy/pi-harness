import test from 'node:test';
import assert from 'node:assert/strict';
import {installMouseCapture} from '../components/firstmate/mouse-capture.mjs';
function setup(){
  let listener, overlay, removed=false;
  const writes=[], hints=[];
  const group={expanded:false,setExpanded(value){this.expanded=value;}};
  const tui={terminal:{write:s=>writes.push(s)},requestRender(){},
    addInputListener(fn){listener=fn;return()=>{removed=true;};},
    getTopmostVisibleOverlay:()=>overlay,beforeTerminalStop(){return 'stopped';}};
  const original=tui.beforeTerminalStop;
  const mouse=installMouseCapture(tui,row=>row===4?group:undefined,value=>hints.push(value));
  return {mouse,tui,group,writes,hints,original,input:s=>listener(s),overlay:value=>{overlay=value;},removed:()=>removed};
}
const press='\x1b[<0;8;5M',release='\x1b[<0;8;5m',wheel='\x1b[<64;8;5M';
test('default mode does not capture mouse or keyboard; startup clears old reporting',()=>{
 const x=setup();assert.equal(x.mouse.enabled,false);
 for(const input of [press,release,wheel,'hello','\x1b'])assert.equal(x.input(input),undefined);
 assert.equal(x.group.expanded,false);assert.equal(x.writes.join(''),'\x1b[?1000l\x1b[?1006l');
});
test('opt-in clicks toggle only matching header presses and support batched packets',()=>{
 const x=setup();x.mouse.setEnabled(true);x.input(press+release);assert.equal(x.group.expanded,true);
 x.input(press);x.input(release);assert.equal(x.group.expanded,false);
 x.input('\x1b[<0;8;4M'+release);assert.equal(x.group.expanded,false);
 assert.equal(x.input('typing'),undefined);
});
test('wheel and Escape release capture; dialogs are not swallowed',()=>{
 for(const input of [wheel,'\x1b']){const x=setup();x.mouse.setEnabled(true);x.input(input);assert.equal(x.mouse.enabled,false);assert.equal(x.input(wheel),undefined);}
 const x=setup();x.mouse.setEnabled(true);x.overlay({});assert.equal(x.input(press),undefined);assert.equal(x.mouse.enabled,false);
});
test('stop and dispose restore native mode and lifecycle hooks',()=>{
 const x=setup();x.mouse.setEnabled(true);assert.equal(x.tui.beforeTerminalStop(),'stopped');assert.equal(x.mouse.enabled,false);
 x.mouse.setEnabled(true);x.mouse.dispose();assert.equal(x.mouse.enabled,false);assert.equal(x.removed(),true);assert.equal(x.tui.beforeTerminalStop,x.original);
});
