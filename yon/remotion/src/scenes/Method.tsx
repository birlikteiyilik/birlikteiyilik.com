import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, DISPLAY, Kicker} from './shared';

export const Method: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps,width,height} = useVideoConfig();
  const portrait = height > width;
  const sides = [
    {title:'Seminer\nserisi değil.',copy:'Tek yönlü konuşma · aşırı vaat · zorunlu özel paylaşım',bg:'#e4e3de',color:'rgba(16,44,67,.5)'},
    {title:'Deneme\nalanı.',copy:'Uygulama · prova · geri bildirim · gerçek takip',bg:COLORS.ink,color:COLORS.white},
  ];
  return <AbsoluteFill style={{display:'grid',gridTemplateColumns:portrait?'1fr':'1fr 1fr',gridTemplateRows:portrait?'1fr 1fr':'1fr',fontFamily:'Inter, Arial, sans-serif'}}>{sides.map((side,index)=><div key={side.title} style={{position:'relative',display:'flex',flexDirection:'column',justifyContent:'center',padding:portrait?'90px 64px 58px':'120px',backgroundColor:side.bg,color:side.color,clipPath:portrait?`inset(${interpolate(frame,[index*.2*fps,(index*.2+.8)*fps],[100,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}% 0 0 0)`:`inset(0 ${interpolate(frame,[index*.2*fps,(index*.2+.8)*fps],[100,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}% 0 0)`}}><Kicker>Bu bir</Kicker><div style={{whiteSpace:'pre-line',fontFamily:DISPLAY,fontSize:portrait?96:118,lineHeight:.86,letterSpacing:'-.06em',textTransform:'uppercase',marginTop:24}}>{side.title}</div><div style={{marginTop:portrait?28:48,maxWidth:620,fontSize:portrait?25:22,lineHeight:1.6,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',opacity:.68}}>{side.copy}</div></div>)}</AbsoluteFill>;
};
