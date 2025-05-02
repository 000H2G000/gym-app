import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, Menu } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Workout } from '../../services/workoutService';
import { Alert } from 'react-native';

// Define error color for the app
const ERROR_COLOR = '#FF5252';

interface SwipeableWorkoutCardProps {
  workout: Workout;
  onDelete: (id: string) => void;
  onSelect: (workout: Workout) => void;
}

const SwipeableWorkoutCard: React.FC<SwipeableWorkoutCardProps> = ({ 
  workout, 
  onDelete, 
  onSelect 
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const colorScheme = useColorScheme() || 'light';
  const [menuVisible, setMenuVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  
  // Create a red background with delete icon for the right swipe action
  const renderRightActions = () => {
    return (
      <View 
        style={{
          backgroundColor: ERROR_COLOR,
          width: 80,
          justifyContent: 'center',
          alignItems: 'center',
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
          height: '100%'
        }}
      >
        <Ionicons name="trash" size={28} color="white" />
      </View>
    );
  };
  
  const capitalizeFirstLetter = (string: string = '') => {
    return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
  };
  
  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={1}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableOpen={() => {
        onDelete(workout.id!);
      }}
    >
      <Card 
        style={styles.workoutCard}
        onPress={() => onSelect(workout)}
      >
        <Card.Content>
          <View style={styles.workoutHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
              {workout.name}
            </Text>
            
            <Menu
              visible={menuVisible && editingWorkout?.id === workout.id}
              onDismiss={() => {
                setMenuVisible(false);
                setEditingWorkout(null);
              }}
              anchor={
                <IconButton
                  icon="dots-horizontal"
                  onPress={() => {
                    setEditingWorkout(workout);
                    setMenuVisible(true);
                  }}
                />
              }
            >
              <Menu.Item
                leadingIcon="pencil"
                onPress={() => {
                  setMenuVisible(false);
                  setEditingWorkout(null);
                  Alert.alert("Rename", "Please use the edit button from the main screen to rename workouts.");
                }}
                title="Rename"
              />
              <Menu.Item
                leadingIcon="trash-can"
                onPress={() => {
                  setMenuVisible(false);
                  Alert.alert(
                    'Delete Workout',
                    `Are you sure you want to delete "${workout.name}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        onPress: () => onDelete(workout.id!),
                        style: 'destructive'
                      }
                    ]
                  );
                }}
                title="Delete"
              />
            </Menu>
          </View>
          
          <View style={styles.workoutMeta}>
            <View style={styles.workoutMetaItem}>
              <Ionicons 
                name="barbell-outline" 
                size={16} 
                color={Colors[colorScheme].mutedText} 
              />
              <Text 
                style={{ 
                  marginLeft: 4, 
                  color: Colors[colorScheme].mutedText 
                }}
              >
                {workout.exercises.length} exercises
              </Text>
            </View>
            {workout.updatedAt && (
              <Text style={{ color: Colors[colorScheme].mutedText, fontSize: 12 }}>
                Last updated: {workout.updatedAt.seconds ? new Date(workout.updatedAt.seconds * 1000).toLocaleDateString() : 'Recently'}
              </Text>
            )}
          </View>
          
          {workout.exercises.length > 0 && (
            <View style={styles.previewExercises}>
              {workout.exercises.slice(0, 2).map((exercise, index) => (
                <Text 
                  key={index} 
                  style={{ color: Colors[colorScheme].text }}
                  numberOfLines={1}
                >
                  • {exercise.name}
                </Text>
              ))}
              {workout.exercises.length > 2 && (
                <Text style={{ color: Colors[colorScheme].mutedText }}>
                  + {workout.exercises.length - 2} more
                </Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  workoutCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewExercises: {
    marginTop: 16,
  },
});

export default SwipeableWorkoutCard;