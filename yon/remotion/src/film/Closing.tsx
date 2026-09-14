import React from 'react';
import {Img,staticFile,interpolate,useCurrentFrame} from 'remotion';
import {C,Copy,Label,TextBlock,Title,clamp,ease,useLayout} from './system';
export const Closing:React.FC=()=>{
  const f=useCurrentFrame();const{portrait}=useLayout();
  return <><div style={{position:'absolute',left:portrait?250:960,top:portrait?900:80,width:portrait?750:920,height:portrait?910:1000,overflow:'hidden',borderRadius:'48% 48% 0 0',clipPath:`inset(${interpolate(f,[0,65],[100,0],{...clamp,easing:ease})}% 0 0)`}}><Img src={staticFile('kendi-yolunda-next-step.webp')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'40% center',filter:'saturate(.55)',scale:interpolate(f,[0,210],[1.12,1.02],clamp)}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#0c232ba0,transparent),linear-gradient(0deg,#0c232b,transparent 60%)'}}/></div><TextBlock top={portrait?210:255}><Label>Kendi Yolunda</Label><Title lines={['BİR SONRAKİ','ADIMIN','SENİN.']} size={140} accent={2}/><Copy>Birlikte deneyelim.<br/>Birlikte başlayalım.</Copy><div style={{color:C.paper,fontSize:26,marginTop:50,letterSpacing:'.12em',opacity:interpolate(f,[100,130],[0,1],clamp)}}>BİRLİKTEİYİLİK.COM / YON</div></TextBlock></>;
};
