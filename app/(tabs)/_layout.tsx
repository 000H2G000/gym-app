import React from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isLight = colorScheme !== 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].mutedText,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
          height: 70,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
          paddingBottom: 10,
          paddingTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
              <Ionicons name={focused ? "barbell" : "barbell-outline"} size={24} color={color} />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          unmountOnBlur: true,
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: '',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={styles.centerTabButton}
              onPress={() => props.onPress?.()}
            >
              <View style={[styles.centerTabButtonInner, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                <Ionicons name="people" size={26} color="white" />
              </View>
              <Text style={[styles.centerTabLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Partners</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
              <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={24} color={color} />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerTabButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTabButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  centerTabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 16,
  }
});
