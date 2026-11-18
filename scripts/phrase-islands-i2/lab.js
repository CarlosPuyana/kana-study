const $=id=>document.getElementById(id),audio=new Audio();audio.preload='auto';
let generation=0,timer=null,release=null,finish=null,paused=false,revealed=false;
const events=[],evaluations={},assignments={};
function status(message){$('status').textContent=message;events.push({time:Date.now(),message});}
function stop(){generation++;clearTimeout(timer);timer=null;release?.();release=null;finish?.();finish=null;audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();paused=false;status('Parado');}
function wait(ms){return new Promise(r=>{release=r;timer=setTimeout(()=>{timer=null;release=null;r();},ms);});}
async function play(paths,repetitions=+$('repeat').value,gap=+$('gap').value){
 stop();const token=generation;
 for(const path of paths)for(let n=0;n<repetitions;n++){
  if(token!==generation)return;
  audio.src=path;audio.playbackRate=+$('speed').value;audio.preservesPitch=true;
  let failed=false;
  const done=new Promise(r=>{finish=r;audio.onended=r;audio.onerror=()=>{failed=true;status('Error: archivo ausente o no reproducible');r();};});
  try{status('Cargando');await audio.play();if(token!==generation)return;status('Reproduciendo');await done;if(token!==generation)return;finish=null;if(failed)return;}
  catch(e){if(token===generation)status(e.name==='NotAllowedError'?'Bloqueado: pulsa reproducir para autorizar audio':'Error de reproducción');return;}
  if(n<repetitions-1||path!==paths.at(-1)){status('Pausa entre audios');await wait(gap*1000);if(token!==generation)return;}
 }
 status('Finalizado');
}
$('stop').onclick=stop;
$('pause').onclick=async()=>{
 if(timer){status('Para cancelar una pausa entre audios, usa Parar');return;}
 if(!audio.getAttribute('src'))return;
 if(!paused){audio.pause();paused=true;status('Pausado');}
 else{try{await audio.play();paused=false;status('Reproduciendo');}catch(e){status(e.name==='NotAllowedError'?'Bloqueado: pulsa reproducir para autorizar audio':'Error de reproducción');}}
};
$('speed').onchange=()=>{audio.playbackRate=+$('speed').value;};
const corrected=new URLSearchParams(location.search).get('revision')==='corrected';
const response=await fetch(corrected?'corrections.json':'manifest.json');
const manifest=response.ok?await response.json():{rows:[]};
if(corrected)document.querySelector('h1').textContent+=' · Correcciones (sin mezclar originales)';
const ids=[...new Set(manifest.rows.map(r=>r.id))];
for(const [i,id]of ids.entries()){
 const rows=manifest.rows.filter(r=>r.id===id);if(i%2)rows.reverse();assignments[id]=Object.fromEntries(rows.map((r,j)=>[['A','B'][j],r]));
 const article=document.createElement('article'),h=document.createElement('h2');h.textContent=id;article.append(h);
 const p=document.createElement('p');p.className='text';p.lang='ja';p.textContent=rows[0].text;article.append(p);
 const reading=document.createElement('p');reading.lang='ja';reading.textContent=rows[0].reading;article.append(reading);
 for(const [label,row]of Object.entries(assignments[id])){
  const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent='Candidato '+label;field.append(legend);
  const button=document.createElement('button');button.textContent='Escuchar '+label;button.dataset.id=id;button.dataset.label=label;button.onclick=()=>play([row.path]);field.append(button);
  const data=evaluations[id+'-'+label]={phraseId:id,label,revision:row.revision??'automatic',naturalness:null,pronunciation:null,rhythm:null,notes:''};
  for(const [key,text]of [['naturalness','Naturalidad'],['pronunciation','Pronunciación'],['rhythm','Ritmo']]){
   const l=document.createElement('label');l.textContent=text+' (1–5)';const input=document.createElement('select');input.innerHTML='<option value="">Sin evaluar</option>'+[1,2,3,4,5].map(n=>`<option>${n}</option>`).join('');input.onchange=()=>{data[key]=input.value?+input.value:null;$('reveal').disabled=!Object.values(evaluations).every(v=>v.naturalness&&v.pronunciation&&v.rhythm);};l.append(input);field.append(l);
  }
  const l=document.createElement('label');l.style.display='block';l.textContent='Notas: lecturas, partículas, acento, pausas';const notes=document.createElement('textarea');notes.oninput=()=>data.notes=notes.value;l.append(notes);field.append(l);article.append(field);
 }
 $('phrases').append(article);
}
const first=assignments[ids[0]]?.A;
if(first){const b=document.createElement('button');b.textContent='Pista precompuesta A';b.onclick=()=>play(['track-'+first.engine+'.wav'],1,0);$('tracks').append(b);$('sequence').onclick=()=>play(manifest.rows.filter(r=>r.engine===first.engine).slice(0,3).map(r=>r.path),2,1);}
$('reveal').onclick=()=>{revealed=true;$('identity').textContent=JSON.stringify(Object.fromEntries(Object.entries(assignments).map(([id,labels])=>[id,Object.fromEntries(Object.entries(labels).map(([l,r])=>[l,`${r.engine} ${r.version}: ${r.voice}, ${r.style.name}`]))])),null,2);};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({evaluations:Object.values(evaluations),revealed,assignment:Object.fromEntries(Object.entries(assignments).map(([id,labels])=>[id,Object.fromEntries(Object.entries(labels).map(([l,r])=>[l,{engine:r.engine,sha256:r.sha256}]))])),events},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='islands-i2-evaluation.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
window.addEventListener('pagehide',stop);status(`${ids.length} frases disponibles. Escucha humana pendiente.`);
// Test seam for the isolated lab only; no application service or storage involved.
window.lab={audio,play,stop,events,get pendingTimer(){return timer!==null;},assignments};
