import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {asset, BODY, COLORS, DISPLAY, Kicker} from './shared';

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: COLORS.deep, color: COLORS.white, fontFamily: BODY}}>
      <Img
        src={asset('kendi-yolunda-hero.webp')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: portrait ? '76% center' : 'center',
          scale: interpolate(frame, [0, durationInFrames], [1.09, 1.01], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          translate: interpolate(frame, [0, durationInFrames], [portrait ? '22px 0px' : '42px 0px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        }}
      />
      <AbsoluteFill style={{background: portrait ? 'linear-gradient(0deg,rgba(8,27,43,.98),rgba(8,27,43,.58) 72%,rgba(8,27,43,.22))' : 'linear-gradient(90deg,rgba(8,27,43,.96),rgba(8,27,43,.64) 48%,rgba(8,27,43,.08) 78%)'}} />
      <div style={{position: 'absolute', left: portrait ? 64 : 120, right: portrait ? 64 : 120, top: portrait ? 260 : 235}}>
        <Kicker>Birlikte İyilik Akademi sunar</Kicker>
        <div style={{overflow: 'hidden', marginTop: portrait ? 34 : 28}}>
          <div style={{fontFamily: DISPLAY, fontSize: portrait ? 162 : 250, fontWeight: 900, lineHeight: .78, letterSpacing: '-.075em', textTransform: 'uppercase', opacity: interpolate(frame, [0.12 * fps, 0.9 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16,1,.3,1)}), translate: interpolate(frame, [0.12 * fps, 0.9 * fps], ['0px 120px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16,1,.3,1)})}}>Kendi</div>
        </div>
        <div style={{overflow: 'hidden'}}>
          <div style={{fontFamily: DISPLAY, fontSize: portrait ? 138 : 226, fontWeight: 900, lineHeight: .88, letterSpacing: '-.075em', textTransform: 'uppercase', color: 'transparent', WebkitTextStroke: portrait ? '3px white' : '4px white', opacity: interpolate(frame, [0.35 * fps, 1.15 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16,1,.3,1)}), translate: interpolate(frame, [0.35 * fps, 1.15 * fps], ['0px 110px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.16,1,.3,1)})}}>Yolunda</div>
        </div>
        <div style={{marginTop: portrait ? 56 : 40, maxWidth: portrait ? 820 : 850, fontSize: portrait ? 38 : 34, lineHeight: 1.5, color: 'rgba(255,255,255,.78)', opacity: interpolate(frame, [0.7 * fps, 1.45 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), translate: interpolate(frame, [0.7 * fps, 1.45 * fps], ['0px 24px', '0px 0px'], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>Ne istediğini tam bilmiyor olabilirsin.<br/>Bu, geride olduğun anlamına gelmez.</div>
      </div>
      <div style={{position:'absolute',left:portrait?64:120,right:portrait?64:120,bottom:portrait?180:115,display:'flex',gap:portrait?55:80,borderTop:'1px solid rgba(255,255,255,.3)',paddingTop:30,opacity:interpolate(frame,[45,80],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}>
        {[['6','hafta'],['6','uygulama'],['1','yol haritası']].map(([value,label],index)=><div key={label} style={{translate:interpolate(frame,[45+index*6,80+index*6],['0px 28px','0px 0px'],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)})}}><b style={{fontFamily:DISPLAY,fontSize:portrait?78:66,lineHeight:1}}>{value}</b><div style={{marginTop:10,fontSize:portrait?25:21,color:'rgba(255,255,255,.7)'}}>{label}</div></div>)}
      </div>
    </AbsoluteFill>
  );
};
