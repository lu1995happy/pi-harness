import fs from 'node:fs';
import path from 'node:path';
import {Image,Text,Container} from '@earendil-works/pi-tui';
import {Type} from 'typebox';

export function installImages(pi:any){
  function display(file:string,cwd:string){
    const resolved=path.resolve(cwd,file);
    const stat=fs.statSync(resolved);
    if(!stat.isFile()||stat.size>10*1024*1024)throw new Error('Preview requires an image file of at most 10 MiB.');
    const bytes=fs.readFileSync(resolved);
    const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':bytes.toString('ascii',0,3)==='GIF'?'image/gif':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
    if(!mime)throw new Error('Supported previews: PNG, JPEG, GIF and WebP.');
    pi.appendEntry('harness-image',{file:resolved,mime,data:bytes.toString('base64')});
    return resolved;
  }
  pi.registerEntryRenderer('harness-image',(entry:any,_options:any,theme:any)=>{
    const box=new Container();
    box.addChild(new Text(`Viewed image · ${entry.data.file}`,0,1));
    box.addChild(new Image(entry.data.data,entry.data.mime,{fallbackColor:(s:string)=>theme.fg('muted',s)},{maxWidthCells:60,maxHeightCells:16}));
    return box;
  });
  pi.registerCommand('harness-image',{description:'Preview a local image inline (PNG/JPEG/GIF/WebP).',handler:async(args:string,ctx:any)=>{try{display(args.trim(),ctx.cwd);}catch(error:any){ctx.ui.notify(error.message,'error');}}});
  pi.registerTool({name:'fm_image',label:'Show image',description:'Show a local image artifact to the user as an inline terminal thumbnail. Does not send image bytes to the model.',parameters:Type.Object({path:Type.String()}),execute:async(_id:any,args:any,_signal:any,_update:any,ctx:any)=>({content:[{type:'text',text:`Displayed ${display(args.path,ctx.cwd)}`}],details:{path:args.path}})});
}
