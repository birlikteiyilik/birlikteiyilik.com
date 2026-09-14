import React from 'react';
import {Img,staticFile,interpolate,useCurrentFrame} from 'remotion';
import {ArtBox,C,Copy,HEAD,Label,TextBlock,Title,clamp,useLayout} from './system';
export const Practice:React.FC=()=>{
  const f=useCurrentFrame();const{portrait}=useLayout();
  return <><Img src={staticFile('kendi-yolunda-workshop.webp')} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',filter:'saturate(.2)',opacity:.22,scale:interpolate(f,[0,210],[1.07,1],clamp)}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#0c232be8,transparent)'}}/><TextBlock><Label>Bilmekten yapmaya.</Label><Title lines={['DENE.','PROVA ET.','BAŞLAT.']} size={151} accent={2}/><Copy>Her hafta 90 dakika.<br/>En az yarısı uygulama.</Copy></TextBlock><ArtBox><div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:C.paper}}><div style={{fontFamily:HEAD,fontSize:portrait?155:170,letterSpacing:'-.08em'}}>90<span style={{color:C.red}}>′</span></div><div style={{fontSize:26,letterSpacing:'.1em'}}>UYGULAMA ODAKLI</div></div></ArtBox></>;
};
