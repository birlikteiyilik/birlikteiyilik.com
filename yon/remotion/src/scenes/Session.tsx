import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {asset, COLORS, DISPLAY, Kicker} from './shared';

const flow = [[10,'Karşılama'],[20,'Ana kavram'],[15,'Gösterim'],[35,'Uygulama'],[10,'Yansıtma']] as const;

export const Session: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps,width,height,durationInFrames} = useVideoConfig();
  const portrait = height > width;
  return <AbsoluteFill style={{overflow:'hidden',backgroundColor:COLORS.deep,color:COLORS.white,fontFamily:'Inter, Arial, sans-serif'}}>
    <Img src={asset('kendi-yolunda-workshop.webp')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:portrait?'52% center':'center',scale:interpolate(frame,[0,durationInFrames],[1.08,1.01],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}/>
    <AbsoluteFill style={{background:portrait?'linear-gradient(0deg,rgba(8,27,43,.98),rgba(8,27,43,.5) 80%,rgba(8,27,43,.25))':'linear-gradient(90deg,rgba(8,27,43,.96),rgba(8,27,43,.45))'}}/>
    <div style={{position:'absolute',left:portrait?64:120,right:portrait?64:120,top:portrait?210:175}}><Kicker>Her hafta aynı ritim</Kicker><div style={{fontFamily:DISPLAY,fontSize:portrait?112:160,lineHeight:.86,letterSpacing:'-.06em',textTransform:'uppercase',opacity:interpolate(frame,[0,.8*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[0,.8*fps],['0px 75px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>90 dakika.<br/><span style={{color:COLORS.red}}>En az yarısı uygulama.</span></div></div>
    <div style={{position:'absolute',left:portrait?64:120,right:portrait?64:120,bottom:portrait?150:90,display:'grid',gridTemplateColumns:portrait?'repeat(5,1fr)':'10fr 20fr 15fr 35fr 10fr',border:'2px solid rgba(255,255,255,.3)'}}>{flow.map(([minutes,label],index)=><div key={label} style={{minHeight:portrait?260:150,display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:portrait?'20px 10px':'24px',borderRight:index<4?'2px solid rgba(255,255,255,.22)':'none',backgroundColor:index===3?COLORS.red:'transparent',clipPath:`inset(${interpolate(frame,[index*.12*fps,(index*.12+.65)*fps],[100,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}% 0 0 0)`}}><b style={{fontFamily:DISPLAY,fontSize:portrait?44:48}}>{minutes}′</b><span style={{marginTop:10,fontSize:portrait?15:15,letterSpacing:'.08em',textTransform:'uppercase',writingMode:portrait?'vertical-rl':'horizontal-tb'}}>{label}</span></div>)}</div>
  </AbsoluteFill>;
};
