import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface WorkoutDayButtonProps {
  day: string;
  isSelected: boolean;
  onPress: () => void;
  workoutCount: number;
}

const WorkoutDayButton: React.FC<WorkoutDayButtonProps> = ({ 
  day, 
  isSelected, 
  onPress, 
  workoutCount 
}) => {
  const colorScheme = useColorScheme() || 'light';
  
  // Get the first 3 letters of the day
  const dayLabel = day.substring(0, 3);
  
  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.dayButton,
          {
            backgroundColor: isSelected 
              ? Colors[colorScheme].primary
              : Colors[colorScheme].cardBackground,
            borderColor: isSelected 
              ? Colors[colorScheme].primary 
              : Colors[colorScheme].border
          }
        ]}
      >
        <Text
          style={[
            styles.dayText,
            {
              color: isSelected 
                ? '#fff'
                : Colors[colorScheme].text,
              fontWeight: isSelected ? 'bold' : 'normal'
            }
          ]}
        >
          {dayLabel}
        </Text>
        {workoutCount > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isSelected 
                  ? '#fff' 
                  : Colors[colorScheme].primary
              }
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                color: isSelected 
                  ? Colors[colorScheme].primary 
                  : '#fff',
                fontWeight: 'bold'
              }}
            >
              {workoutCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    position: 'relative'
  },
  dayText: {
    fontSize: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default WorkoutDayButton; 