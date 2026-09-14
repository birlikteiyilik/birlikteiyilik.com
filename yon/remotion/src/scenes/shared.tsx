import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const COLORS = {
  ink: '#102c43',
  deep: '#081b2b',
  paper: '#f3f2ed',
  bright: '#fbfaf7',
  red: '#ec003f',
  muted: '#6a747b',
  white: '#ffffff',
};

export const DISPLAY = '"Arial Black", "Arial Narrow", sans-serif';
export const BODY = 'Inter, Arial, sans-serif';

export const asset = (name: string) => staticFile(name);

export const SceneShell: React.FC<{
  background?: string;
  color?: string;
  children: React.ReactNode;
}> = ({background = COLORS.paper, color = COLORS.ink, children}) => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: background,
        color,
        fontFamily: BODY,
        padding: portrait ? '150px 64px 150px' : '125px 120px 105px',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  return (
    <div
      style={{
        color: COLORS.red,
        fontSize: width < 1200 ? 24 : 20,
        fontWeight: 800,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        opacity: interpolate(frame, [0, 0.45 * fps], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [0, 0.45 * fps], ['0px 24px', '0px 0px'], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {children}
    </div>
  );
};

export const Route: React.FC<{active: number}> = ({active}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const portrait = height > width;
  return (
    <div
      style={{
        position: 'absolute',
        left: portrait ? 64 : 120,
        right: portrait ? 64 : 120,
        bottom: portrait ? 110 : 82,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr auto 1fr auto 1fr auto',
        alignItems: 'center',
        opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      {[1, 2, 3, 4, 5, 6].map((number, index) => (
        <React.Fragment key={number}>
          <div
            style={{
              width: portrait ? 46 : 42,
              height: portrait ? 46 : 42,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              color: number <= active ? COLORS.white : COLORS.muted,
              backgroundColor: number <= active ? COLORS.red : COLORS.paper,
              border: `3px solid ${number <= active ? COLORS.red : 'rgba(16,44,67,.16)'}`,
              fontSize: 16,
              fontWeight: 800,
              scale: number === active
                ? interpolate(frame, [0, 0.35 * fps], [0.76, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.spring({damping: 180}),
                    output: 'perceptual-scale',
                  })
                : 1,
            }}
          >
            {number}
          </div>
          {index < 5 ? (
            <div style={{height: 3, backgroundColor: index < active ? COLORS.red : 'rgba(16,44,67,.14)'}} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};
