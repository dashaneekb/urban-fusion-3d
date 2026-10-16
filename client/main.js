// Simple static client using Three.js
// Minimal mobile-friendly scene, player cube, and WebSocket sync client

const WS_URL = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.hostname + ':8080';

import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

let socket;
let clientId = null;
const players = {}; // id -> {mesh, pos}

// Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// simple lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,10,7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// ground
const groundGeo = new THREE.PlaneGeometry(200,200);
const groundMat = new THREE.MeshStandardMaterial({color:0x2d6a4f});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// local player mesh
const boxGeo = new THREE.BoxGeometry(1,1.8,1);
const boxMat = new THREE.MeshStandardMaterial({color:0x4cc9f0});
const localMesh = new THREE.Mesh(boxGeo, boxMat);
localMesh.position.set(0,0.9,0);
scene.add(localMesh);

camera.position.set(0,5,8);
camera.lookAt(localMesh.position);

// basic input state
const input = {forward:0, right:0};
let lastSend = 0;

function connect() {
  try{
    socket = new WebSocket(WS_URL);
  }catch(e){
    alert('WebSocket connection failed: '+e.message);
    return;
  }

  socket.onopen = ()=>{
    console.log('ws open');
  };
  socket.onmessage = (e)=>{
    const msg = JSON.parse(e.data);
    if(msg.type === 'welcome'){
      clientId = msg.id;
      console.log('client id', clientId);
    }else if(msg.type === 'state'){
      // players state
      for(const id in msg.players){
        if(id === clientId) continue;
        const p = msg.players[id];
        if(!players[id]){
          const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({color:0xf72585}));
          scene.add(m);
          players[id] = {mesh:m, pos:new THREE.Vector3()};
        }
        players[id].pos.set(p.x,p.y,p.z);
      }
      // remove disconnected players
      for(const id in players){
        if(!msg.players[id]){
          scene.remove(players[id].mesh);
          delete players[id];
        }
      }
    }else if(msg.type === 'shot'){
      // simple visual for shots
      flashShot();
    }
  };
  socket.onclose = ()=>{console.log('ws closed');};
}

function flashShot(){
  const orig = localMesh.material.color.getHex();
  localMesh.material.color.set(0xffff00);
  setTimeout(()=>localMesh.material.color.set(orig),150);
}

// simple mobile input: left half move by dragging; right half tap to shoot
let activeTouch = null;
let startTouch = null;

renderer.domElement.addEventListener('touchstart',(e)=>{
  const t = e.changedTouches[0];
  const x = t.clientX;
  if(x < window.innerWidth/2){
    activeTouch = t.identifier; startTouch = {x:t.clientX,y:t.clientY};
  }else{
    // shoot
    if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:'shoot'}));
    flashShot();
  }
});

renderer.domElement.addEventListener('touchmove',(e)=>{
  if(activeTouch===null) return;
  for(const t of e.changedTouches){
    if(t.identifier===activeTouch){
      const dx = (t.clientX - startTouch.x)/100;
      const dy = (t.clientY - startTouch.y)/100;
      input.right = dx;
      input.forward = -dy;
    }
  }
});

renderer.domElement.addEventListener('touchend',(e)=>{
  for(const t of e.changedTouches){
    if(t.identifier===activeTouch){
      activeTouch = null; startTouch = null; input.forward=0; input.right=0;
    }
  }
});

// keyboard for desktop
window.addEventListener('keydown',(e)=>{
  if(e.key==='w') input.forward = 1;
  if(e.key==='s') input.forward = -1;
  if(e.key==='a') input.right = -1;
  if(e.key==='d') input.right = 1;
  if(e.key===' ') { if(socket && socket.readyState===WebSocket.OPEN) socket.send(JSON.stringify({type:'shoot'})); flashShot(); }
});
window.addEventListener('keyup',(e)=>{
  if(['w','s'].includes(e.key)) input.forward = 0;
  if(['a','d'].includes(e.key)) input.right = 0;
});

function sendInput(){
  if(!socket || socket.readyState!==WebSocket.OPEN) return;
  const now = Date.now();
  if(now - lastSend < 50) return; // 20Hz
  lastSend = now;
  socket.send(JSON.stringify({type:'input', forward:input.forward, right:input.right}));
}

const speed = 0.12;
setInterval(()=>{
  // local movement prediction
  const dx = input.right * speed;
  const dz = input.forward * speed;
  localMesh.position.x += dx;
  localMesh.position.z += dz;
  camera.position.x = localMesh.position.x;
  camera.position.z = localMesh.position.z + 8;
  camera.lookAt(localMesh.position);
  sendInput();
},50);

function animate(){
  requestAnimationFrame(animate);
  // lerp remote players
  for(const id in players){
    const p = players[id];
    p.mesh.position.lerp(p.pos, 0.2);
  }
  renderer.render(scene,camera);
}

// connect button
const btn = document.createElement('button');
btn.textContent = 'Connect & Play (mobile friendly)';
btn.style.position='absolute'; btn.style.top='12px'; btn.style.left='12px'; btn.style.zIndex='10';
document.body.appendChild(btn);
btn.onclick = ()=>{ connect(); btn.style.display='none'; };

animate();
