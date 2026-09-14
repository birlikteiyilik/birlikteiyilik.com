import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {DURATION_IN_FRAMES, KendiYolunda, SCENE_COUNT} from './KendiYolunda';

const labels=['Başlangıç','İhtiyaç','Yöntem','Hafta 1','Hafta 2','Hafta 3','Hafta 4','Hafta 5','Hafta 6','90 dakika','Çıktılar','Güven','Pilot','Sonraki adım'];
const START_FRAME=48;
const END_FRAME=984;

const MotionPlayer:React.FC=()=>{
  const playerRef=useRef<PlayerRef>(null);
  const [portrait,setPortrait]=useState(window.innerHeight>window.innerWidth);

  useEffect(()=>{
    const onResize=()=>setPortrait(window.innerHeight>window.innerWidth);
    window.addEventListener('resize',onResize,{passive:true});
    return()=>window.removeEventListener('resize',onResize);
  },[]);

  useEffect(()=>{
    const story=document.querySelector<HTMLElement>('.story');
    const pageProgress=document.getElementById('pageProgress');
    const chapterProgress=document.getElementById('chapterProgress');
    const chapterTitle=document.getElementById('chapterTitle');
    const currentStep=document.getElementById('currentStep');
    const stage=document.getElementById('storyStage');
    if(!story||!pageProgress||!chapterProgress||!chapterTitle||!currentStep||!stage)return;
    stage.classList.add('is-loaded');
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetFrame=START_FRAME;
    let displayedFrame=START_FRAME;
    let animationFrame=0;

    const animate=()=>{
      const distance=targetFrame-displayedFrame;
      const follow=Math.abs(distance)>144?.55:.24;
      displayedFrame=reduceMotion?targetFrame:displayedFrame+distance*follow;
      if(Math.abs(distance)<.12)displayedFrame=targetFrame;
      playerRef.current?.seekTo(Math.round(displayedFrame));
      const visualRatio=Math.min(1,Math.max(0,(displayedFrame-START_FRAME)/(END_FRAME-START_FRAME)));
      const chapter=Math.min(SCENE_COUNT-1,Math.max(0,Math.round(visualRatio*(SCENE_COUNT-1))));
      chapterTitle.textContent=labels[chapter];
      currentStep.textContent=String(chapter+1).padStart(2,'0');
      stage.classList.toggle('is-last',chapter===SCENE_COUNT-1);
      if(displayedFrame!==targetFrame)animationFrame=requestAnimationFrame(animate);
      else animationFrame=0;
    };

    const onScroll=()=>{
      const travel=Math.max(1,story.offsetHeight-window.innerHeight);
      const ratio=Math.min(1,Math.max(0,(window.scrollY-story.offsetTop)/travel));
      targetFrame=START_FRAME+ratio*(END_FRAME-START_FRAME);
      pageProgress.style.transform=`scaleX(${ratio})`;
      chapterProgress.style.transform=`scaleX(${ratio})`;
      if(!animationFrame)animationFrame=requestAnimationFrame(animate);
    };

    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll,{passive:true});
    onScroll();
    return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);if(animationFrame)cancelAnimationFrame(animationFrame);};
  },[portrait]);

  return <Player
    ref={playerRef}
    component={KendiYolunda}
    durationInFrames={DURATION_IN_FRAMES}
    compositionWidth={portrait?1080:1920}
    compositionHeight={portrait?1920:1080}
    fps={30}
    controls={false}
    autoPlay={false}
    initialFrame={START_FRAME}
    loop={false}
    clickToPlay={false}
    style={{width:'100%',height:'100%',backgroundColor:'#081b2b'}}
  />;
};

const mount=document.getElementById('remotion-root');
if(mount)createRoot(mount).render(<MotionPlayer/>);
