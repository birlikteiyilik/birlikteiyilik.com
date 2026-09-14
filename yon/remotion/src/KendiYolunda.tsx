import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {Hero} from './scenes/Hero';
import {Need} from './scenes/Need';
import {Method} from './scenes/Method';
import {Week, weeks} from './scenes/Week';
import {Session} from './scenes/Session';
import {Outcomes} from './scenes/Outcomes';
import {Safety} from './scenes/Safety';
import {Pilot} from './scenes/Pilot';
import {Decision} from './scenes/Decision';
import {asset, COLORS} from './scenes/shared';

export const SCENE_DURATION = 180;
export const TRANSITION_DURATION = 36;
export const SCENE_COUNT = 14;
export const DURATION_IN_FRAMES = SCENE_COUNT * SCENE_DURATION - (SCENE_COUNT - 1) * TRANSITION_DURATION;
export const labels = ['Başlangıç','İhtiyaç','Yöntem','Hafta 1','Hafta 2','Hafta 3','Hafta 4','Hafta 5','Hafta 6','90 dakika','Çıktılar','Güven','Pilot','Sonraki adım'];

// Slow optical drift keeps reading holds alive; every motion is baked into the film.
const Shot: React.FC<{children:React.ReactNode;index:number}> = ({children,index}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{overflow:'hidden'}}>
    <AbsoluteFill style={{
      scale:interpolate(frame,[0,SCENE_DURATION],[1.014,1],{extrapolateRight:'clamp'}),
      opacity:interpolate(frame,[0,18,SCENE_DURATION-28,SCENE_DURATION],[1,1,1,index===13?1:0],{extrapolateRight:'clamp'}),
    }}>{children}</AbsoluteFill>
  </AbsoluteFill>;
};

export const KendiYolunda:React.FC=()=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const portrait=height>width;
  const scenes=[<Hero/>,<Need/>,<Method/>,...weeks.map(week=><Week {...week}/>),<Session/>,<Outcomes/>,<Safety/>,<Pilot/>,<Decision/>];
  return <AbsoluteFill lang="tr" style={{background:COLORS.deep}}>
    <TransitionSeries>
      {scenes.map((scene,index)=><React.Fragment key={labels[index]}>
        {index>0&&<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames:TRANSITION_DURATION,easing:Easing.inOut(Easing.cubic)})}/>}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name={labels[index]}><Shot index={index}>{scene}</Shot></TransitionSeries.Sequence>
      </React.Fragment>)}
    </TransitionSeries>
    <div style={{position:'absolute',left:portrait?64:120,top:portrait?66:45,opacity:.72,mixBlendMode:'difference'}}>
      <Img src={asset('birlikte-iyilik-akademi-wordmark-white.webp')} style={{width:portrait?430:360,height:'auto'}}/>
    </div>
    <div style={{position:'absolute',bottom:0,left:0,height:4,width:`${100*frame/(DURATION_IN_FRAMES-1)}%`,background:COLORS.red}}/>
  </AbsoluteFill>;
};
