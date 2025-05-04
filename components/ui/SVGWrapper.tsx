import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Rect, Path, G, ClipPath, Defs, LinearGradient, Stop } from 'react-native-svg';
import { filterResponderProps } from '../../utils/platformUtils';

/**
 * Platform-specific SVG components that automatically filter out
 * responder props on web to prevent warnings
 */

// Create wrapped versions of all SVG components
const createWrappedComponent = (Component: any) => {
  return React.forwardRef((props: any, ref) => {
    // Filter out responder props on web
    const filteredProps = Platform.OS === 'web' 
      ? filterResponderProps(props)
      : props;
    
    return <Component {...filteredProps} ref={ref} />;
  });
};

// Create wrapped versions of common SVG components
export const WrappedSvg = createWrappedComponent(Svg);
export const WrappedCircle = createWrappedComponent(Circle);
export const WrappedRect = createWrappedComponent(Rect);
export const WrappedPath = createWrappedComponent(Path);
export const WrappedG = createWrappedComponent(G);
export const WrappedClipPath = createWrappedComponent(ClipPath);
export const WrappedDefs = createWrappedComponent(Defs);
export const WrappedLinearGradient = createWrappedComponent(LinearGradient);
export const WrappedStop = createWrappedComponent(Stop);

// For easy importing
export default {
  Svg: WrappedSvg,
  Circle: WrappedCircle,
  Rect: WrappedRect,
  Path: WrappedPath,
  G: WrappedG,
  ClipPath: WrappedClipPath,
  Defs: WrappedDefs,
  LinearGradient: WrappedLinearGradient,
  Stop: WrappedStop
};