// Simple WebSocket authoritative server for City Strike prototype
// Run: node index.js

const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({port:PORT});
console.log('City Strike server listening on',PORT);

let nextId = 1;
const players = {}; // id -> {ws, x,y,z, vx,vy,vz, lastSeen}

function broadcastState(){
  const payload = {type:'state', players:{}};
  for(const id in players){
    const p = players[id];
    payload.players[id] = {x:p.x,y:p.y,z:p.z};
  }
  const s = JSON.stringify(payload);
  for(const id in players){
    players[id].ws.send(s);
  }
}

function tickPhysics(){
  // simple physics: apply velocity
  for(const id in players){
    const p = players[id];
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    // damp velocities
    p.vx *= 0.9; p.vy *= 0.9; p.vz *= 0.9;
  }
}

setInterval(()=>{ tickPhysics(); broadcastState(); }, 50); // 20Hz

wss.on('connection',(ws,req)=>{
  // limit to 4 players
  if(Object.keys(players).length >= 4){
    ws.send(JSON.stringify({type:'error', message:'room full (max 4)'}));
    ws.close();
    return;
  }
  const id = String(nextId++);
  players[id] = {ws,x:0,y:0,z:0,vx:0,vy:0,vz:0,lastSeen:Date.now()};
  console.log('player connected',id);
  ws.send(JSON.stringify({type:'welcome', id}));

  ws.on('message',(raw)=>{
    let msg;
    try{ msg = JSON.parse(raw); }catch(e){ return; }
    if(msg.type === 'input'){
      // simple input: forward/right [-1..1]
      const f = Math.max(-1, Math.min(1, msg.forward||0));
      const r = Math.max(-1, Math.min(1, msg.right||0));
      const speed = 0.12;
      players[id].vx = r * speed;
      players[id].vz = f * speed;
      players[id].lastSeen = Date.now();
    }else if(msg.type === 'shoot'){
      // broadcast shot event
      const ev = JSON.stringify({type:'shot', from:id});
      for(const pid in players) players[pid].ws.send(ev);
    }
  });

  ws.on('close',()=>{
    console.log('disconnect',id);
    delete players[id];
  });
});
