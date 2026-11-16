import type Phaser from 'phaser'
/** Cancellable scene-time work. All interrupted promises settle; no stale phase can commit. */
export class ActionScope {
  private revision=0
  private closed=false
  private pending=new Set<()=>void>()
  begin(){this.cancel();return this.revision}
  valid(token:number){return !this.closed&&token===this.revision}
  cancel(){this.revision++;for(const stop of [...this.pending])stop();this.pending.clear()}
  constructor(private scene:Phaser.Scene){}
  wait(token:number,ms:number):Promise<boolean>{
    if(!this.valid(token))return Promise.resolve(false)
    return new Promise(resolve=>{let done=false;const finish=(ok:boolean)=>{if(done)return;done=true;event.remove(false);this.pending.delete(stop);resolve(ok&&this.valid(token))};const event=this.scene.time.delayedCall(ms,()=>finish(true));const stop=()=>finish(false);this.pending.add(stop)})
  }
  tween(token:number,config:Phaser.Types.Tweens.TweenBuilderConfig):Promise<boolean>{
    if(!this.valid(token))return Promise.resolve(false)
    return new Promise(resolve=>{let done=false;const finish=(ok:boolean)=>{if(done)return;done=true;this.pending.delete(stop);resolve(ok&&this.valid(token))};const tween=this.scene.tweens.add({...config,onComplete:()=>finish(true),onStop:()=>finish(false)});const stop=()=>{tween.stop();finish(false)};this.pending.add(stop)})
  }
  dispose(){this.cancel();this.closed=true}
}
