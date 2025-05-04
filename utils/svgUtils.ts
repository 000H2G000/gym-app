import { Platform } from 'react-native';

// List of React Native responder props that cause warnings on web
const responderProps = [
  'onStartShouldSetResponder',
  'onMoveShouldSetResponder',
  'onResponderGrant',
  'onResponderMove',
  'onResponderRelease',
  'onResponderTerminate',
  'onResponderTerminationRequest',
  'onShouldBlockNativeResponder',
  'onStartShouldSetResponderCapture',
  'onMoveShouldSetResponderCapture'
];

/**
 * Filters out React Native responder props when on web platform to prevent warnings
 * @param props The original props object
 * @returns A new props object without responder props on web, or the original props on native
 */
export const filterWebResponderProps = (props: any) => {
  if (Platform.OS === 'web') {
    const filteredProps = { ...props };
    responderProps.forEach(prop => {
      if (filteredProps[prop]) {
        delete filteredProps[prop];
      }
    });
    return filteredProps;
  }
  return props;
};