import React from 'react';
import {AbsoluteFill,Img,Sequence,interpolate,interpolateColors,staticFile,useCurrentFrame} from 'remotion';
import {C,FONT,SHOT,TOTAL,clamp,ease,isLight,useLayout} from './system';
import {LivingLine} from './Line';
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
const ShotLayer:React.FC<{children:React.ReactNode;last:boolean}>=({children,last})=>{const f=useCurrentFrame();return <AbsoluteFill style={{opacity:interpolate(f,[0,15,SHOT-30,SHOT],[1,1,1,last?1:0],clamp),translate:`0 ${interpolate(f,[SHOT-30,SHOT],[0,last?0:-30],{...clamp,easing:ease})}px`}}>{children}</AbsoluteFill>;};

export const Film:React.FC=()=>{
  const f=useCurrentFrame();const{portrait}=useLayout();
  const chapter=Math.min(10,Math.floor(f/SHOT)),local=f-chapter*SHOT;
  const bg=interpolateColors(local,[0,45],[isLight(Math.max(0,chapter-1))?C.paper:C.ink,isLight(chapter)?C.paper:C.ink]);
  return <AbsoluteFill lang="tr" style={{backgroundColor:bg,overflow:'hidden',fontFamily:FONT}}>
    <div style={{position:'absolute',inset:0,opacity:.035,backgroundImage:'repeating-linear-gradient(0deg,transparent 0,transparent 3px,#7e9294 4px)'}}/>
    {scenes.map((Scene,i)=><Sequence key={FILM_LABELS[i]} from={i*SHOT} durationInFrames={SHOT} name={FILM_LABELS[i]}><ShotLayer last={i===10}><Scene/></ShotLayer></Sequence>)}
    <LivingLine/>
    <div style={{position:'absolute',left:portrait?86:120,top:portrait?78:50,mixBlendMode:'difference',opacity:.8}}><Img src={staticFile('birlikte-iyilik-akademi-wordmark-white.webp')} style={{width:portrait?460:350}}/></div>
    <div style={{position:'absolute',right:portrait?86:105,top:portrait?100:70,color:C.paper,mixBlendMode:'difference',fontSize:portrait?23:20,letterSpacing:'.1em'}}>KENDİ YOLUNDA <span style={{opacity:.4}}> / 2026</span></div>
    <div style={{position:'absolute',left:0,bottom:0,height:3,width:`${100*f/(TOTAL-1)}%`,backgroundColor:C.red}}/>
  </AbsoluteFill>;
};
