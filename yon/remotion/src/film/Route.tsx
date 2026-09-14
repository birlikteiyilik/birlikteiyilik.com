import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
import {ArtBox,C,Copy,HEAD,Label,TextBlock,Title,clamp} from './system';
export const RouteScene:React.FC=()=>{
  const f=useCurrentFrame();
  return <><TextBlock><Label>6 haftalık uygulamalı hayat becerileri</Label><Title lines={['KENDİNE','DOĞRU.']} size={162} accent={1}/><Copy>Önce yönünü gör.<br/>Sonra kendini ifade et.<br/>Ardından düzenini kur.</Copy></TextBlock><ArtBox><svg width="100%" height="100%" viewBox="0 0 800 800">{[0,1,2,3,4,5].map(i=>{const t=i/5,x=65+670*t,y=420+90*Math.sin(t*Math.PI*2*1.25);return <g key={i} opacity={interpolate(f,[40+i*9,60+i*9],[0,1],clamp)}><circle cx={x} cy={y} r="24" fill={C.ink} stroke={C.red} strokeWidth="2"/><text x={x} y={y+8} textAnchor="middle" fill={C.paper} fontFamily={HEAD} fontSize="22">{i+1}</text><text x={x} y={y+(i%2?90:-80)} textAnchor="middle" fill="#bac7c4" fontSize="19" fontFamily="Arial">{['Kendini tanı','Hedef koy','Dinle','İfade et','Zamanı gör','Adım at'][i]}</text></g>;})}</svg></ArtBox></>;
};
