import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect, Ellipse } from 'react-native-svg';
import { ICONS } from './iconData';
import { colors } from '../theme';

const ELEMENTOS = { path: Path, rect: Rect, circle: Circle, line: Line, polyline: Polyline, polygon: Polygon, ellipse: Ellipse };

/** Ícone Lucide (mesmo traço do protótipo: stroke 2, cantos arredondados). */
export default function Icon({ name, size = 16, color = colors.foreground, strokeWidth = 2, style }) {
  const els = ICONS[name] || [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {els.map(([tag, attrs], i) => {
        const C = ELEMENTOS[tag];
        return C ? <C key={i} {...attrs} /> : null;
      })}
    </Svg>
  );
}
