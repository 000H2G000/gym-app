import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, Redirect } from 'expo-router';
import { Text } from 'react-native-paper';
import { AuthContext } from '../_layout';
import { isUserAdmin } from '@/services/userService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AdminLayout() {
  const { user } = useContext(AuthContext);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const adminStatus = await isUserAdmin(user.uid);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme || 'light'].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme || 'light'].text }]}>
          Verifying admin access...
        </Text>
      </View>
    );
  }

  // Redirect non-admins to home
  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme || 'light'].adminHeaderBackground || '#1a237e',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});