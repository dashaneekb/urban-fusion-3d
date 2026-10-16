// City Strike server serving client static and WebSocket authoritative server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.static(path.join(__dirname, '..', 'client')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

console.log('City Strike server starting on', PORT);

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
    const ws = players[id].ws;
    if(ws.readyState === WebSocket.OPEN){
      try{ ws.send(s); }catch(e){ }
    }
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
    try{ ws.send(JSON.stringify({type:'error', message:'room full (max 4)'})); }catch(e){}
    ws.close();
    return;
  }
  const id = String(nextId++);
  players[id] = {ws,x:0,y:0,z:0,vx:0,vy:0,vz:0,lastSeen:Date.now()};
  console.log('player connected',id);
  try{ ws.send(JSON.stringify({type:'welcome', id})); }catch(e){}

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
      for(const pid in players){
        const pws = players[pid].ws;
        if(pws.readyState === WebSocket.OPEN){
          try{ pws.send(ev); }catch(e){}
        }
      }
    }
  });

  ws.on('close',()=>{
    console.log('disconnect',id);
    delete players[id];
  });
});

server.listen(PORT, ()=> console.log('HTTP & WS server listening on', PORT));
