import React from 'react';
import {TransitionSeries, springTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {Hero} from './scenes/Hero';
import {Need} from './scenes/Need';
import {Method} from './scenes/Method';
import {Week, weeks} from './scenes/Week';
import {Session} from './scenes/Session';
import {Outcomes} from './scenes/Outcomes';
import {Safety} from './scenes/Safety';
import {Pilot} from './scenes/Pilot';
import {Decision} from './scenes/Decision';

export const SCENE_DURATION = 96;
export const TRANSITION_DURATION = 24;
export const SCENE_COUNT = 14;
export const DURATION_IN_FRAMES = SCENE_COUNT * SCENE_DURATION - (SCENE_COUNT - 1) * TRANSITION_DURATION;

const Flow:React.FC=()=> (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="Başlangıç"><Hero/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="İhtiyaç"><Need/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="Yöntem"><Method/></TransitionSeries.Sequence>
    {weeks.map((week)=><React.Fragment key={week.number}>
      <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
      <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name={`Hafta ${week.number}`}><Week {...week}/></TransitionSeries.Sequence>
    </React.Fragment>)}
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="90 dakika"><Session/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="Çıktılar"><Outcomes/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="Güven"><Safety/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="Pilot"><Pilot/></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction:'from-bottom'})} timing={springTiming({durationInFrames:TRANSITION_DURATION,config:{damping:200}})}/>
    <TransitionSeries.Sequence durationInFrames={SCENE_DURATION} name="Sonraki adım"><Decision/></TransitionSeries.Sequence>
  </TransitionSeries>
);

export const KendiYolunda:React.FC=()=> <Flow/>;
