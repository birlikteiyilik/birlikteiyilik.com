import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const SHOT=210;
export const TOTAL=11*SHOT;
export const C={ink:'#0c232b',paper:'#eee9dd',red:'#f13c53',muted:'#8c9698'};
export const HEAD='"Arial Black", Arial, sans-serif';
export const FONT='Arial, sans-serif';
export const ease=Easing.bezier(.22,1,.36,1);
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export const isLight=(index:number)=>[3,4,5,7,8].includes(index);
export const useLayout=()=>{const{width,height}=useVideoConfig();return{portrait:height>width,width,height};};

export const Label:React.FC<{children:React.ReactNode;dark?:boolean}>=({children,dark=false})=><div style={{fontFamily:FONT,fontSize:26,fontWeight:700,letterSpacing:'.17em',color:dark?'#8b6e67':'#d29a94',textTransform:'uppercase',marginBottom:35}}>{children}</div>;

export const Title:React.FC<{lines:string[];accent?:number;size?:number;dark?:boolean}>=({lines,accent=-1,size=142,dark=false})=>{
  const f=useCurrentFrame();const{portrait}=useLayout();
  return <div style={{fontFamily:HEAD,fontWeight:900,fontSize:portrait?Math.min(size,125):size,lineHeight:1.02,letterSpacing:'-.065em',textTransform:'uppercase'}}>
    {lines.map((line,i)=><div key={line} style={{overflow:'hidden',paddingBottom:8}}><div style={{color:i===accent?C.red:dark?C.ink:C.paper,translate:`0 ${interpolate(f,[12+i*6,49+i*6],[120,0],{...clamp,easing:ease})}%`}}>{line}</div></div>)}
  </div>;
};

export const Copy:React.FC<{children:React.ReactNode;dark?:boolean}>=({children,dark=false})=>{
  const f=useCurrentFrame();const{portrait}=useLayout();
  return <div style={{fontFamily:FONT,fontSize:portrait?36:32,lineHeight:1.48,maxWidth:portrait?880:840,marginTop:38,color:dark?'#536269':'#bcc5c2',opacity:interpolate(f,[52,82],[0,1],clamp),translate:`0 ${interpolate(f,[52,82],[16,0],{...clamp,easing:ease})}px`}}>{children}</div>;
};

export const TextBlock:React.FC<{children:React.ReactNode;top?:number}>=({children,top})=>{
  const{portrait}=useLayout();
  return <div style={{position:'absolute',left:portrait?86:120,top:top??(portrait?210:218),width:portrait?908:1030}}>{children}</div>;
};

export const Tag:React.FC<{children:React.ReactNode;dark?:boolean}>=({children,dark=false})=><div style={{fontSize:24,fontFamily:FONT,color:dark?'#627078':'#9facad',letterSpacing:'.05em',borderTop:`1px solid ${dark?'#0c232b33':'#eee9dd33'}`,paddingTop:24,marginTop:44}}>{children}</div>;

export const ArtBox:React.FC<{children:React.ReactNode}>=({children})=>{
  const{portrait}=useLayout();
  return <div style={{position:'absolute',left:portrait?120:1120,top:portrait?1080:180,width:portrait?840:700,height:portrait?740:720}}>{children}</div>;
};
