import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
export function enableGraphics(text){
  const header=/^\[experimental\][^\r\n]*\r?$/m;
  if(!header.test(text))return text.trimEnd()+'\n\n[experimental]\nkitty_graphics = true\n';
  const start=text.search(header),next=text.slice(start+1).search(/^\[/m);
  const end=next<0?text.length:start+1+next;
  let section=text.slice(start,end);
  if(/^\s*kitty_graphics\s*=/m.test(section))section=section.replace(/^\s*kitty_graphics\s*=.*$/m,'kitty_graphics = true');
  else section=section.replace(header,match=>match+'\nkitty_graphics = true');
  return text.slice(0,start)+section+text.slice(end);
}
export async function installGraphics(){
  const file=process.env.HERDR_CONFIG_PATH||path.join(process.platform==='win32'?process.env.APPDATA:path.join(os.homedir(),'.config'),'herdr','config.toml');
  const old=await fs.readFile(file,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
  const next=enableGraphics(old);
  if(next!==old){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.harness-backup-'+Date.now(),old);await fs.writeFile(file,next);}
  return file;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await installGraphics());
