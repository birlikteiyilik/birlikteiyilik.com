import React from 'react';
import {Composition} from 'remotion';
import {DURATION_IN_FRAMES, KendiYolunda} from './KendiYolunda';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="KendiYolunda"
    component={KendiYolunda}
    durationInFrames={DURATION_IN_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);
