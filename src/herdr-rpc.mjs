import net from 'node:net';
// Herdr uses a named pipe derived from its socket path on Windows.
export function endpoint(socketPath, platform=process.platform){
  return platform==='win32' && !socketPath.startsWith('\\\\.\\pipe\\') ? '\\\\.\\pipe\\'+socketPath.replaceAll('/','\\') : socketPath;
}
export function herdrRequest(method,params={},socketPath=process.env.HERDR_SOCKET_PATH){
  if(!socketPath)return Promise.reject(new Error('HERDR_SOCKET_PATH is unavailable'));
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection(endpoint(socketPath));let data='',settled=false;
    function finish(error,result){if(settled)return;settled=true;socket.destroy();error?reject(error):resolve(result);}
    socket.setTimeout(3000,()=>finish(new Error('Herdr request timed out')));
    socket.on('error',error=>finish(error));
    socket.on('end',()=>finish(new Error('Herdr closed the request')));
    socket.on('connect',()=>socket.write(JSON.stringify({id:'harness-ui',method,params})+'\n'));
    socket.on('data',chunk=>{data+=chunk.toString();if(data.length>4*1024*1024)return finish(new Error('Herdr response too large'));
      if(!data.includes('\n'))return;
      try{const reply=JSON.parse(data.slice(0,data.indexOf('\n')));finish(reply.error?new Error(reply.error.code+': '+reply.error.message):null,reply.result);}catch(error){finish(error);}
    });
  });
}
