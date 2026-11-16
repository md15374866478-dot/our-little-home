import Phaser from 'phaser'
import type {Direction} from './input'
import type {Point} from './pathfinding'
import {mouthAnchor,attach} from './interactionAnchors'
import {ActionScope} from './ActionScope'
export class BallAttachment {
 readonly ball:Phaser.GameObjects.Arc
 private shadow:Phaser.GameObjects.Ellipse
 phase:'ABSENT'|'GROUND'|'FLYING'|'MOUTH'='ABSENT'
 private ground:Point={x:0,y:0}
 constructor(scene:Phaser.Scene){this.ball=scene.add.circle(0,0,3.5,0xc95740).setStrokeStyle(1,0x813e31).setDepth(10).setVisible(false);this.shadow=scene.add.ellipse(0,0,8,3,0x403324,.25).setDepth(9).setVisible(false)}
 get position():Point{return {...this.ground}}
 blocks(point:Point){return this.phase==='GROUND'&&Math.hypot(point.x-this.ground.x,point.y-this.ground.y)<8}
 async toss(scope:ActionScope,token:number,from:Point,to:Point){this.phase='FLYING';this.ball.setVisible(true);this.shadow.setVisible(true);const progress={t:0};return scope.tween(token,{targets:progress,t:1,duration:550,onUpdate:()=>{this.ground={x:from.x+(to.x-from.x)*progress.t,y:from.y+(to.y-from.y)*progress.t};this.ball.setPosition(this.ground.x,this.ground.y-Math.sin(Math.PI*progress.t)*25-10*(1-progress.t));this.shadow.setPosition(this.ground.x,this.ground.y)}}).then(ok=>{if(ok){this.phase='GROUND';this.ground=to;this.ball.setPosition(to.x,to.y)}return ok})}
 attach(sprite:Phaser.GameObjects.Sprite,direction:Direction){const anchor=mouthAnchor(direction,Number(sprite.frame.name));const p=attach(sprite,anchor);this.phase='MOUTH';this.ball.setPosition(p.x,p.y).setDepth(sprite.depth+(anchor.behind?-.002:.004)).setVisible(true);this.shadow.setVisible(false)}
 async take(scope:ActionScope,token:number,sprite:Phaser.GameObjects.Sprite,direction:Direction){this.phase='FLYING';this.shadow.setVisible(false);const target=attach(sprite,{x:direction==='left'?-14:direction==='right'?14:0,y:direction==='up'?-26:-4});const ok=await scope.tween(token,{targets:this.ball,x:target.x,y:target.y,duration:320});if(ok)this.phase='MOUTH';return ok}
 async place(scope:ActionScope,token:number,point:Point){this.phase='FLYING';const ok=await scope.tween(token,{targets:this.ball,x:point.x,y:point.y,duration:320});if(ok){this.phase='GROUND';this.ground=point;this.ball.setDepth(10+point.y/1000).setVisible(true);this.shadow.setPosition(point.x,point.y).setVisible(true)}return ok}
 clear(){this.phase='ABSENT';this.ball.setVisible(false);this.shadow.setVisible(false)}
 dispose(){this.ball.destroy();this.shadow.destroy()}
}
