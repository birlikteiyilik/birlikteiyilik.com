import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, DISPLAY, Kicker, SceneShell} from './shared';

const lines = [
  ['Ne istediğimi', 'bilmiyorum.'],
  ['Hedef koyuyorum ama', 'başlayamıyorum.'],
  ['Kendimi anlatırken', 'geri çekiliyorum.'],
  ['Zamanımın nereye gittiğini', 'göremiyorum.'],
];

export const Need: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;
  return (
    <SceneShell background={COLORS.bright}>
      <div style={{position:'absolute',right:portrait?-40:60,top:portrait?180:100,color:'rgba(16,44,67,.035)',fontFamily:DISPLAY,fontSize:portrait?220:330,lineHeight:.8,textTransform:'uppercase',writingMode:portrait?'vertical-rl':'horizontal-tb'}}>NEDEN?</div>
      <Kicker>Bazen mesele motivasyon değildir</Kicker>
      <div style={{marginTop: portrait ? 60 : 38}}>
        {lines.map((line, index) => (
          <div key={line[0]} style={{overflow:'hidden',borderTop:'2px solid rgba(16,44,67,.12)',padding:portrait?'28px 0':'20px 0'}}>
            <div style={{fontFamily:DISPLAY,fontSize:portrait?62:78,lineHeight:.95,letterSpacing:'-.045em',textTransform:'uppercase',opacity:interpolate(frame,[index*.18*fps,(index*.18+.55)*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:interpolate(frame,[index*.18*fps,(index*.18+.55)*fps],['0px 72px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)})}}>{line[0]} <span style={{color:COLORS.red}}>{line[1]}</span></div>
          </div>
        ))}
      </div>
      <div style={{marginTop:portrait?38:24,fontSize:portrait?31:25,lineHeight:1.5,color:COLORS.muted,opacity:interpolate(frame,[.8*fps,1.5*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>Büyük sözler yerine <strong style={{color:COLORS.ink}}>uygulanabilir bir sonraki adım.</strong></div>
    </SceneShell>
  );
};
