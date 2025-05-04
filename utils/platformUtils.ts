/**
 * Utility functions for handling platform-specific code
 */
import { Platform } from 'react-native';

/**
 * Returns responder props only for native platforms.
 * For web, returns an empty object to prevent warnings.
 * 
 * @param responderProps Object containing responder props
 * @returns Object with responder props for native, empty object for web
 */
export const getResponderProps = (responderProps: any) => {
  // On web, don't include responder props to prevent warnings
  if (Platform.OS === 'web') {
    return {};
  }
  
  // On native platforms, return the responder props as-is
  return responderProps;
};

/**
 * Filters out React Native responder props when running on web platform
 * @param props Original props that might contain responder handlers
 * @returns Props without responder handlers on web, or original props on native
 */
export function filterResponderProps<T extends Object>(props: T): T {
  // Only filter props on web platform
  if (Platform.OS === 'web') {
    const filteredProps = { ...props };
    const responderProps = [
      'onStartShouldSetResponder',
      'onMoveShouldSetResponder', 
      'onResponderGrant',
      'onResponderMove',
      'onResponderRelease', 
      'onResponderTerminate',
      'onResponderTerminationRequest',
      'onShouldBlockNativeResponder'
    ];
    
    responderProps.forEach(prop => {
      if (prop in filteredProps) {
        delete filteredProps[prop as keyof T];
      }
    });
    
    return filteredProps;
  }
  
  // Return original props for native platforms
  return props;
}