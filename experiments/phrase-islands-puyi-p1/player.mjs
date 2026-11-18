/** Isolated P1 experiment. No app services, storage, authentication or personal content. */
export class ActiveClock {
  constructor(now=()=>Date.now()){this.now=now;this.total=0;this.since=null;}
  reset(){this.total=0;this.since=null;}
  start(){if(this.since===null)this.since=this.now();}
  pause(){this.total=this.elapsed();this.since=null;}
  elapsed(){return this.total+(this.since===null?0:Math.max(0,this.now()-this.since));}
}
export class ClipSession {
  constructor({createAudio=()=>new Audio(),now=()=>Date.now(),schedule=(callback,ms)=>globalThis.setTimeout(callback,ms),cancel=handle=>globalThis.clearTimeout(handle),emit=()=>{},fetchClip=async url=>{
    const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return URL.createObjectURL(await r.blob());
  },releaseClip=url=>URL.revokeObjectURL(url)}={}){
    Object.assign(this,{createAudio,now,schedule,cancel,emit,fetchClip,releaseClip});this.clock=new ActiveClock(now);this.phase='idle';this.epoch=0;this.logs=[];this.urls=new Set();this.next=null;
  }
  log(event,extra={}){const row={event,wallMs:this.now(),activeMs:Math.round(this.clock.elapsed()),phase:this.phase,index:this.index??null,clip:this.clips?.[this.index]?.id??null,...extra};this.logs.push(row);if(this.logs.length>5000)this.logs.shift();this.emit(row);}
  snapshot(){return {phase:this.phase,index:this.index??0,activeMs:this.clock.elapsed(),remainingMs:Math.max(0,(this.budget??0)-this.clock.elapsed()),cycle:this.cycle??0};}
  clearTimers(){this.cancel(this.timer);this.cancel(this.watchdog);this.timer=null;this.watchdog=null;}
  clearAudio(){if(this.audio){for(const event of ['onended','onplaying','onerror','onwaiting','onstalled','onpause'])this.audio[event]=null;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();}}
  stop(reason='manual'){this.epoch++;this.clearTimers();this.clearAudio();this.clock.pause();this.phase='stopped';for(const u of this.urls)this.releaseClip(u);this.urls.clear();this.next=null;this.log('stop',{reason});}
  start(clips,{durationMs=300000,gapMs=5000,strategy='reuse',preload=false,nativeLoop=false,graceMs=15000}={}){
    if(!Array.isArray(clips)||!clips.length||clips.some(c=>!c.id||!c.url||!Number.isFinite(c.durationSeconds)||c.durationSeconds<=0||c.durationSeconds*1000>graceMs))throw Error('Invalid or overlong clip');
    if(!Number.isFinite(durationMs)||durationMs<=0||durationMs>1800000||!Number.isFinite(gapMs)||gapMs<0||gapMs>30000||!['reuse','replace'].includes(strategy)||graceMs<=0||graceMs>15000)throw Error('Invalid session settings');
    this.stop('restart');this.clock.reset();Object.assign(this,{clips,budget:durationMs,gapMs,strategy,preload,nativeLoop,graceMs,index:0,cycle:0});this.audio=this.createAudio();this.phase='loading';this.clock.start();this.log('start',{durationMs,gapMs,strategy,preload,nativeLoop,graceMs});this.playIndex();
  }
  arm(){this.cancel(this.watchdog);const token=this.epoch;const left=this.budget-this.clock.elapsed();this.watchdog=this.schedule(()=>{if(token!==this.epoch)return;this.reconcile();},Math.max(1,left>0?left:this.graceMs+left));}
  reconcile(){
    if(['idle','paused','stopped','error','blocked'].includes(this.phase))return;
    const elapsed=this.clock.elapsed();if(elapsed>=this.budget){
      if(this.nativeLoop||this.phase!=='playing'||elapsed>=this.budget+this.graceMs){this.stop('deadline');return;}
      this.log('finishing-current',{overrunMs:elapsed-this.budget});
    }
    this.arm();
  }
  playIndex(){
    if(this.clock.elapsed()>=this.budget){this.stop('deadline-before-clip');return;}
    const token=this.epoch,clip=this.clips[this.index];this.clearAudio();if(this.strategy==='replace')this.audio=this.createAudio();
    const audio=this.audio;let url=clip.url;
    if(this.next?.id===clip.id&&this.next.url){url=this.next.url;this.next=null;this.log('preload-hit');}
    // Retain only current and prefetched Blob URLs. Never retain a full session's copies.
    for(const old of this.urls)if(old!==url&&old!==this.next?.url){this.releaseClip(old);this.urls.delete(old);}
    audio.src=url;audio.preload='auto';audio.loop=this.nativeLoop;this.phase='loading';this.loadStarted=this.now();this.resumingCurrent=false;
    const valid=()=>token===this.epoch&&audio===this.audio;
    audio.onplaying=()=>{
      if(!valid())return;if(this.phase==='paused'){audio.pause();return;}
      if(this.clock.elapsed()>=this.budget&&!this.resumingCurrent){this.stop('late-start-after-deadline');return;}
      this.resumingCurrent=false;this.phase='playing';this.log('playing',{loadMs:this.now()-this.loadStarted,gapObservedMs:this.gapStarted==null?null:this.now()-this.gapStarted,gapActiveMs:this.gapStartedActive==null?null:this.clock.elapsed()-this.gapStartedActive});this.gapStarted=null;this.gapStartedActive=null;this.arm();this.prefetch(token);
    };
    audio.onended=()=>{if(!valid()||this.phase==='paused')return;this.log('ended');if(this.clock.elapsed()>=this.budget){this.stop('finished-current');return;}this.phase='gap';this.gapStarted=this.now();this.gapStartedActive=this.clock.elapsed();this.gapEnd=this.clock.elapsed()+this.gapMs;this.scheduleGap();};
    audio.onerror=()=>{if(valid())this.fail('media-error',audio.error?.code??null);};
    audio.onwaiting=()=>{if(valid())this.log('waiting');};audio.onstalled=()=>{if(valid())this.log('stalled');};
    audio.onpause=()=>{if(valid()&&this.phase==='playing'&&!audio.ended){this.pause('external-pause');}};
    this.log('load');this.arm();this.loadingTimeout=this.clock.elapsed()+15000;
    this.playPromise(audio,token);
  }
  playPromise(audio,token){try{Promise.resolve(audio.play()).catch(e=>{if(token!==this.epoch)return;if(this.phase==='paused'&&e?.name==='AbortError')return;this.fail(e?.name==='NotAllowedError'?'autoplay-blocked':'play-rejected',e?.name??'Error');});}catch(e){if(token===this.epoch)this.fail('play-rejected',e?.name??'Error');}}
  scheduleGap(){this.cancel(this.timer);this.arm();const token=this.epoch;const remaining=Math.max(0,this.gapEnd-this.clock.elapsed());this.timer=this.schedule(()=>{
    if(token!==this.epoch||this.phase!=='gap')return;if(this.clock.elapsed()>=this.budget){this.stop('deadline-in-gap');return;}
    this.index=(this.index+1)%this.clips.length;if(this.index===0)this.cycle++;this.playIndex();
  },Math.min(remaining,Math.max(0,this.budget-this.clock.elapsed())));}
  pause(reason='manual'){if(!['playing','loading','gap'].includes(this.phase))return;this.resumePhase=this.phase;this.clock.pause();this.clearTimers();this.phase='paused';this.audio?.pause();this.log('pause',{reason});}
  resume(){if(this.phase!=='paused')return;if(this.clock.elapsed()>=this.budget+this.graceMs){this.stop('deadline-on-resume');return;}this.clock.start();this.phase=this.resumePhase;this.resumingCurrent=this.phase==='playing';this.log('resume');if(this.phase==='gap')this.scheduleGap();else{this.phase='loading';this.loadingTimeout=this.clock.elapsed()+15000;this.playPromise(this.audio,this.epoch);this.arm();}}
  fail(reason,code){this.epoch++;this.clearTimers();this.clock.pause();this.clearAudio();this.phase=reason==='autoplay-blocked'?'blocked':'error';for(const url of this.urls)this.releaseClip(url);this.urls.clear();this.next=null;this.log('error',{reason,code});}
  prefetch(token){if(!this.preload||this.nativeLoop||this.next)return;const clip=this.clips[(this.index+1)%this.clips.length];const entry={id:clip.id,url:null};this.next=entry;const at=this.now();this.fetchClip(clip.url).then(url=>{
    if(token!==this.epoch||this.next!==entry){this.releaseClip(url);return;}entry.url=url;this.urls.add(url);this.log('prefetched',{target:clip.id,loadMs:this.now()-at});
  }).catch(()=>{if(token===this.epoch){this.next=null;this.log('preload-failed',{target:clip.id});}});}
  tick(){const now=this.now();if(this.lastTick&&now-this.lastTick>2000)this.log('heartbeat-delay',{delayMs:now-this.lastTick});this.lastTick=now;
    if(this.phase==='loading'&&this.clock.elapsed()>this.loadingTimeout){this.fail('load-timeout',null);return;}this.reconcile();}
}
