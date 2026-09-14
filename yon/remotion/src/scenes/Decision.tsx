import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {asset, COLORS, DISPLAY, Kicker} from './shared';

export const Decision:React.FC=()=>{
  const frame=useCurrentFrame(); const {fps,width,height,durationInFrames}=useVideoConfig(); const portrait=height>width;
  return <AbsoluteFill style={{overflow:'hidden',backgroundColor:COLORS.deep,color:COLORS.white,fontFamily:'Inter, Arial, sans-serif'}}>
    <Img src={asset('kendi-yolunda-next-step.webp')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:portrait?'42% center':'center',scale:interpolate(frame,[0,durationInFrames],[1.08,1.01],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[0,durationInFrames],['30px 0px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}/>
    <AbsoluteFill style={{background:portrait?'linear-gradient(0deg,rgba(8,27,43,.98),rgba(8,27,43,.72) 72%,rgba(8,27,43,.18))':'linear-gradient(90deg,rgba(8,27,43,.96),rgba(8,27,43,.7) 55%,rgba(8,27,43,.1) 82%)'}}/>
    <div style={{position:'absolute',left:portrait?64:120,right:portrait?64:120,top:portrait?175:120,bottom:portrait?120:80,display:'flex',flexDirection:'column',justifyContent:'center'}}>
      <Img src={asset('birlikte-iyilik-akademi-wordmark-white.webp')} style={{width:portrait?700:600,height:'auto',marginBottom:portrait?80:65,opacity:interpolate(frame,[0,.7*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[0,.8*fps],['-50px 0px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}/>
      <Kicker>Proje kararı</Kicker>
      <div style={{fontFamily:DISPLAY,fontSize:portrait?91:122,lineHeight:.89,letterSpacing:'-.06em',textTransform:'uppercase',maxWidth:1350,marginTop:24,opacity:interpolate(frame,[.15*fps,.9*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[.15*fps,.9*fps],['0px 80px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>Kendi yolunu bulmak değil.<br/><span style={{color:COLORS.red}}>Bir sonraki adımı başlatmak.</span></div>
      <div style={{maxWidth:950,marginTop:portrait?50:38,color:'rgba(255,255,255,.7)',fontSize:portrait?30:24,lineHeight:1.55,opacity:interpolate(frame,[.7*fps,1.35*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>18–22 yaş için küçük kohort, sabit kolaylaştırıcı, güvenlik protokolü ve gerçek takip sistemiyle pilot uygulamaya hazır.</div>
    </div>
  </AbsoluteFill>;
};
