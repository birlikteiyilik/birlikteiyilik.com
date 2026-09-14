import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
import {ArtBox,C,Copy,HEAD,Label,TextBlock,Title,clamp,ease} from './system';
const outputs=['Değer haritası','Hedef planı','İletişim notları','Konuşma geri bildirimi','Zaman günlüğü','Eylem sözleşmesi'];
export const Portfolio:React.FC=()=>{
  const f=useCurrentFrame();
  return <><TextBlock><Label dark>Sadece bir deneyim değil.</Label><Title dark lines={['ELİNDE','BİR YOL','HARİTASI.']} size={144} accent={2}/><Copy dark>Altı hafta boyunca ürettiğin<br/>altı somut çalışma.</Copy></TextBlock><ArtBox>{outputs.map((label,i)=><div key={label} style={{position:'absolute',left:110+i*7,top:35+i*112,width:560,height:105,border:'1px solid #0c232b22',background:i===5?C.red:'#fbf8f0',boxShadow:'0 12px 35px #0c232b08',display:'flex',alignItems:'center',padding:'0 32px',gap:32,rotate:`${interpolate(f,[25+i*7,80+i*7],[8-i*.8,0],{...clamp,easing:ease})}deg`,translate:`${interpolate(f,[25+i*7,80+i*7],[180,0],{...clamp,easing:ease})}px 0`,opacity:interpolate(f,[25+i*7,50+i*7],[0,1],clamp),color:i===5?C.paper:C.ink}}><span style={{fontFamily:HEAD,fontSize:24,opacity:.45}}>0{i+1}</span><span style={{fontSize:27,fontFamily:HEAD,letterSpacing:'-.03em'}}>{label}</span></div>)}</ArtBox></>;
};
