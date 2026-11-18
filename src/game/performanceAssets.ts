import type Phaser from 'phaser'
import mashuo from '../assets/coordinated/mashuo-pet.png'
import mendu from '../assets/coordinated/mendu-pet.png'
import mashuoArms from '../assets/coordinated/mashuo-arms.png'
import menduArms from '../assets/coordinated/mendu-arms.png'
import lucky from '../assets/coordinated/lucky-performance.png'
import jump from '../assets/coordinated/lucky-jump.png'
import kennelBack from '../assets/coordinated/kennel-back.png'
import kennelCushion from '../assets/coordinated/kennel-cushion.png'
export function preloadPerformance(scene:Phaser.Scene){
 for(const [role,url,arms]of [['mashuo',mashuo,mashuoArms],['mendu',mendu,menduArms]]){
  scene.load.spritesheet(`pet-human-${role}`,url,{frameWidth:40,frameHeight:60})
  scene.load.spritesheet(`pet-arms-${role}`,arms,{frameWidth:40,frameHeight:60})
 }
 scene.load.spritesheet('lucky-performance',lucky,{frameWidth:40,frameHeight:40})
 scene.load.spritesheet('lucky-jump',jump,{frameWidth:40,frameHeight:40});scene.load.image('kennel-back',kennelBack);scene.load.image('kennel-cushion',kennelCushion)
}
