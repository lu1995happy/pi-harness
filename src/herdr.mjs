import { run, shellQuote } from './process.mjs';
import { executable } from './config.mjs';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';

export class Herdr {
  constructor(session=process.env.HERDR_SESSION){this.session=session;}
  args(args){return this.session?['--session',this.session,...args]:args;}
  async call(...args) {
    const result = await run('herdr', this.args(args), { timeout: 45000 });
    if(!result.stdout.trim())return {};
    try { const body = JSON.parse(result.stdout); if (body.error) throw new Error(JSON.stringify(body.error)); return body.result; }
    catch (e) { throw new Error(`Invalid Herdr response: ${result.stdout.slice(0,500)} (${e.message})`); }
  }
  async workspace(cwd,label,env={}) {
    const result = await this.call('workspace','create','--cwd',cwd,'--label',label,'--no-focus',...Object.entries(env).flatMap(([k,v])=>['--env',`${k}=${v}`]));
    return { workspace:result.workspace.workspace_id, tab:result.tab.tab_id, pane:result.root_pane.pane_id };
  }
  async tab(workspace,cwd,label,env={}) {
    const result = await this.call('tab','create','--workspace',workspace,'--cwd',cwd,'--label',label,'--no-focus',...Object.entries(env).flatMap(([k,v])=>['--env',`${k}=${v}`]));
    return {tab:result.tab.tab_id,pane:result.root_pane.pane_id};
  }
  async start(name,kind,pane,args=[]) {
    if(process.platform==='win32'&&kind==='pi'){
      // Herdr 0.8.2's Start-Process(pi) picks npm's POSIX launcher on Windows.
      // Invoke the explicit .cmd through the pane's PowerShell; hooks report readiness.
      await this.call('pane','run',pane,`& ${shellQuote(executable('pi'))} ${args.map(shellQuote).join(' ')}`);
      const deadline=Date.now()+30000;
      while(Date.now()<deadline){
        await delay(500);
        try{const result=await this.call('agent','get',pane);const agent=result.agent;
          if(agent&&['idle','done'].includes(agent.agent_status||agent.state||agent.status)){await this.call('agent','rename',pane,name);return result;}
          if(agent&&(agent.agent_status||agent.state||agent.status)==='blocked')throw new Error('Pi startup needs attention');
        }catch(error){if(String(error.message).includes('needs attention'))throw error;}
      }
      throw new Error('Pi startup did not become ready; inspect its Herdr pane');
    }
    return this.call('agent','start',name,'--kind',kind,'--pane',pane,'--timeout','30000',...(args.length?['--',...args]:[]));
  }
  async changeDirectory(pane,cwd) {
    const token=randomUUID().replaceAll('-','');
    const left=token.slice(0,16),right=token.slice(16);
    // Split the marker in the submitted command so terminal input echo cannot satisfy the wait.
    const command=process.platform==='win32'
      ? `try { Set-Location -LiteralPath ${shellQuote(cwd)} -ErrorAction Stop; Write-Output (${shellQuote(left)} + ${shellQuote(right)}) } catch { Write-Error $_ }`
      : `cd -- ${shellQuote(cwd)} && printf '%s%s\\n' ${shellQuote(left)} ${shellQuote(right)}`;
    await this.call('pane','run',pane,command);
    await this.call('pane','wait-output',pane,'--match',token,'--source','recent-unwrapped','--timeout','15000');
  }
  async prompt(target,text) { return this.call('agent','prompt',target,text); }
  async tabs(workspace) { return (await this.call('tab','list','--workspace',workspace)).tabs; }
  async read(target) { return (await run('herdr',this.args(['pane','read',target,'--source','recent-unwrapped','--lines','100']))).stdout; }
  async close(tab) { return this.call('tab','close',tab); }
}
