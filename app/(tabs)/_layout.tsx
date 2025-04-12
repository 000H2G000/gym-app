import React from 'react';
import { Platform, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
          height: 65,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="dumbbell.fill" color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
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
              <Text style={[styles.centerTabLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Find Partner</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="fork.knife" color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
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
});
