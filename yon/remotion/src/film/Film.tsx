import React from 'react';
import {AbsoluteFill,Img,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {C,FONT,TOTAL,artGeometry,isLight,useLayout} from './system';
import {cameraPage,sceneStart} from './camera';
import {LivingLine,shape} from './Line';
import {Opening} from './Opening';
import {Uncertainty} from './Uncertainty';
import {RouteScene} from './Route';
import {Direction} from './Direction';
import {Voice} from './Voice';
import {Rhythm} from './Rhythm';
import {Practice} from './Practice';
import {Portfolio} from './Portfolio';
import {Safe} from './Safe';
import {PilotFilm} from './Pilot';
import {Closing} from './Closing';

export const FILM_LABELS=['Başlangıç','Bir adım','6 haftalık rota','Yönünü gör','Sesini bul','Düzenini kur','Uygulama','Yol haritası','Güvenli alan','Pilot ve takip','Sonraki adım'];
const scenes=[Opening,Uncertainty,RouteScene,Direction,Voice,Rhythm,Practice,Portfolio,Safe,PilotFilm,Closing];

// The camera looks at one tall illustrated world. Adjacent scenes physically
// coexist, so there is no cut, opacity replacement or empty transition frame.
export const Film:React.FC=()=>{
  const f=useCurrentFrame();
  const {portrait,width,height}=useLayout();
  const page=cameraPage(f);
  const visible=scenes.map((Scene,index)=>({Scene,index})).filter(({index})=>Math.abs(index-page)<1.15);
  const art=artGeometry(portrait),scale=Math.min(art.width,art.height)/800;
  const project=(index:number,t:number)=>{
    const p=shape(index,t,f-sceneStart(index));
    return [art.left+(art.width-800*scale)/2+p[0]*scale,index*height+art.top+(art.height-800*scale)/2+p[1]*scale];
  };
  return <AbsoluteFill lang="tr" style={{backgroundColor:C.ink,overflow:'hidden',fontFamily:FONT}}>
    <div style={{position:'absolute',left:0,top:0,width,height:height*11,translate:`0 ${-page*height}px`}}>
      {visible.map(({index})=><div key={`bg-${index}`} style={{position:'absolute',left:0,top:index*height,width,height,backgroundColor:isLight(index)?C.paper:C.ink}}/>)}
      <svg width={width} height={height*11} style={{position:'absolute',inset:0,overflow:'visible'}} aria-hidden="true">
        {Array.from({length:10},(_,index)=>{
          const start=project(index,1),end=project(index+1,0),rail=width-(portrait?42:64);
          return <path key={index} d={`M${start[0]},${start[1]} C${start[0]+90},${start[1]+90} ${rail},${start[1]+90} ${rail},${start[1]+230} L${rail},${end[1]-230} C${rail},${end[1]-90} ${end[0]+90},${end[1]-90} ${end[0]},${end[1]}`} fill="none" stroke={C.red} strokeWidth={portrait?3:2.5} opacity=".32"/>;
        })}
      </svg>
      {visible.map(({Scene,index})=><div key={index} style={{position:'absolute',left:0,top:index*height,width,height,overflow:'hidden'}}>
        <Sequence from={sceneStart(index)} layout="none" name={FILM_LABELS[index]}>
          {[2,7,9].includes(index)&&<LivingLine chapter={index}/>}
          <Scene/>
          {![2,7,9].includes(index)&&<LivingLine chapter={index}/>}
        </Sequence>
        <div style={{position:'absolute',left:portrait?86:120,top:portrait?78:50,mixBlendMode:'difference',opacity:.8}}><Img src={staticFile('birlikte-iyilik-akademi-wordmark-white.webp')} style={{width:portrait?460:350}}/></div>
        <div style={{position:'absolute',right:portrait?86:105,top:portrait?100:70,color:C.paper,mixBlendMode:'difference',fontSize:portrait?23:20,letterSpacing:'.1em'}}>KENDİ YOLUNDA <span style={{opacity:.4}}> / 2026</span></div>
      </div>)}
    </div>
    <div style={{position:'absolute',inset:0,opacity:.035,backgroundImage:'repeating-linear-gradient(0deg,transparent 0,transparent 3px,#7e9294 4px)',pointerEvents:'none'}}/>
    <div style={{position:'absolute',left:0,bottom:0,height:3,width:`${100*f/(TOTAL-1)}%`,backgroundColor:C.red}}/>
  </AbsoluteFill>;
};
