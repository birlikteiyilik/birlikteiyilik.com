import React from 'react';
import {Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {C,Copy,HEAD,Label,TextBlock,Title,clamp,ease,useLayout} from './system';
export const Opening:React.FC=()=>{
  const f=useCurrentFrame();const{portrait}=useLayout();
  return <>
    <div style={{position:'absolute',left:portrait?340:1030,top:portrait?830:110,width:portrait?660:800,height:portrait?950:920,overflow:'hidden',borderRadius:'48% 48% 3px 3px',clipPath:`inset(${interpolate(f,[0,52],[100,0],{...clamp,easing:ease})}% 0 0)`}}>
      <Img src={staticFile('kendi-yolunda-hero.webp')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'76% center',filter:'saturate(.45)',scale:interpolate(f,[0,210],[1.16,1.04],clamp)}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#0c232bcc,transparent 70%)'}}/>
    </div>
    <TextBlock top={portrait?220:290}><Label>Birlikte İyilik Akademi</Label><Title lines={['KENDİ','YOLUNDA.']} size={178} accent={1}/><Copy>Yolun tamamını bilmek zorunda değilsin.</Copy></TextBlock>
    <div style={{position:'absolute',left:portrait?86:120,bottom:portrait?125:105,fontFamily:HEAD,fontSize:portrait?30:25,letterSpacing:'.07em',color:C.paper,opacity:interpolate(f,[85,110],[0,1],clamp)}}>6 HAFTA <span style={{color:C.red}}> / </span> 6 UYGULAMA <span style={{color:C.red}}> / </span> SENİN YOLUN</div>
  </>;
};
