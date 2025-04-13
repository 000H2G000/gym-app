import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext } from '../(tabs)/_layout';
import { useContext, useEffect } from 'react';

export default function ChatLayout() {
  const colorScheme = useColorScheme();
  // Access the context to make sure it's working
  const auth = useContext(AuthContext);
  
  useEffect(() => {
    console.log("Chat layout auth context:", auth?.user ? "User authenticated" : "No user");
  }, [auth]);
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTitleStyle: {
          color: Colors[colorScheme ?? 'light'].text,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
      }}
    />
  );
} 