import React from 'react';
import {Composition} from 'remotion';
import {Film} from './film/Film';
import {TOTAL} from './film/system';

export const RemotionRoot: React.FC = () => (
  <><Composition
    id="KendiYolunda"
    component={Film}
    durationInFrames={TOTAL}
    fps={30}
    width={1920}
    height={1080}
  /><Composition id="KendiYolunda-Mobile" component={Film} durationInFrames={TOTAL} fps={30} width={1080} height={1920}/></>
);
