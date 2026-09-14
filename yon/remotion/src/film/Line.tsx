import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {ArtBox,C,clamp,SHOT} from './system';

type Point=[number,number];
function along(points:Point[],t:number):Point{const pos=t*(points.length-1),i=Math.min(points.length-2,Math.floor(pos)),u=pos-i;return[points[i][0]+(points[i+1][0]-points[i][0])*u,points[i][1]+(points[i+1][1]-points[i][1])*u];}
function shape(index:number,t:number,frame:number):Point{
  const a=t*Math.PI*2;
  switch(index){
    case 0:return[120+510*t,720-510*t+70*Math.sin(a)];
    case 1:return[400+Math.sin(a*2)*220*(.5+t*.5),400+Math.cos(a*3)*220];
    case 2:return[65+670*t,420+90*Math.sin(a*1.25)];
    case 3:return along([[400,90],[510,340],[710,400],[460,470],[400,710],[320,460],[90,400],[340,335],[400,90]],t);
    case 4:return[65+670*t,400+Math.sin(t*Math.PI*16-frame*.045)*180*Math.sin(t*Math.PI)**2];
    case 5:return along([[80,690],[250,690],[250,540],[415,540],[415,380],[575,380],[575,210],[720,210]],t);
    case 6:return[400+285*Math.cos(a-Math.PI/2),400+285*Math.sin(a-Math.PI/2)];
    case 7:return[140+55*Math.sin(a*3),90+620*t];
    case 8:return along([[400,80],[665,185],[655,450],[560,625],[400,730],[240,625],[145,450],[135,185],[400,80]],t);
    case 9:return[80+640*t,520-260*t+40*Math.sin(a)];
    default:return[65+670*t,720-650*t+90*Math.sin(a)];
  }
}

export const LivingLine:React.FC=()=>{
  const frame=useCurrentFrame();
  const chapter=Math.min(10,Math.floor(frame/SHOT)),local=frame-chapter*SHOT;
  const morph=interpolate(local,[0,48],[0,1],{...clamp,easing:Easing.inOut(Easing.cubic)});
  const points=Array.from({length:121},(_,i)=>{const a=shape(Math.max(0,chapter-1),i/120,frame),b=shape(chapter,i/120,frame);return[a[0]+(b[0]-a[0])*morph,a[1]+(b[1]-a[1])*morph] as Point;});
  const d=points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const head=points[Math.min(120,Math.floor(interpolate(frame,[0,95],[0,120],clamp)))];
  return <ArtBox><svg width="100%" height="100%" viewBox="0 0 800 800" style={{overflow:'visible'}}>
    <path d={d} fill="none" stroke={C.red} strokeWidth="22" opacity=".04" strokeLinecap="round" strokeLinejoin="round"/>
    <path d={d} fill="none" stroke={C.red} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={interpolate(frame,[0,95],[1,0],{...clamp,easing:Easing.inOut(Easing.cubic)})}/>
    <circle cx={head[0]} cy={head[1]} r="9" fill={C.red}/>
  </svg></ArtBox>;
};
