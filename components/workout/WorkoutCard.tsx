import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, IconButton, Menu, Divider, TextInput } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Workout } from '@/types';
import WorkoutExerciseCard from './WorkoutExerciseCard';

interface WorkoutCardProps {
  workout: Workout;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onNavigateToExercises: () => void;
  onDeleteExercise: (workoutId: string, exerciseId: string) => void;
  onEditSets: (workoutId: string, exerciseId: string, sets: number) => void;
  onEditReps: (workoutId: string, exerciseId: string, reps: number) => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onDelete,
  onRename,
  onNavigateToExercises,
  onDeleteExercise,
  onEditSets,
  onEditReps
}) => {
  const colorScheme = useColorScheme() || 'light';
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameMode, setRenameMode] = useState(false);
  const [workoutName, setWorkoutName] = useState(workout.name);
  const swipeableRef = React.useRef<Swipeable>(null);

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleRename = () => {
    setMenuVisible(false);
    setRenameMode(true);
  };

  const handleRenameSubmit = () => {
    onRename(workout.id, workoutName);
    setRenameMode(false);
  };

  const handleDeleteWorkout = () => {
    setMenuVisible(false);
    onDelete(workout.id);
  };

  const renderRightActions = () => (
    <View style={styles.deleteContainer}>
      <Pressable
        onPress={() => {
          closeSwipeable();
          onDelete(workout.id);
        }}
        style={[styles.deleteButton, { backgroundColor: Colors[colorScheme].error }]}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: Colors[colorScheme].cardBackground }
        ]}
      >
        <Card.Content>
          <View style={styles.headerContainer}>
            {renameMode ? (
              <View style={styles.renameContainer}>
                <TextInput
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  style={styles.renameInput}
                  autoFocus
                  mode="outlined"
                  dense
                />
                <IconButton
                  icon="check"
                  size={20}
                  onPress={handleRenameSubmit}
                  style={styles.renameButton}
                />
              </View>
            ) : (
              <View style={styles.titleContainer}>
                <Text variant="titleMedium" style={[styles.title, { color: Colors[colorScheme].text }]}>
                  {workout.name}
                </Text>
                <View style={styles.menuContainer}>
                  <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        onPress={() => setMenuVisible(true)}
                      />
                    }
                    contentStyle={{ backgroundColor: Colors[colorScheme].cardBackground }}
                  >
                    <Menu.Item
                      leadingIcon="pencil"
                      onPress={handleRename}
                      title="Rename"
                      titleStyle={{ color: Colors[colorScheme].text }}
                    />
                    <Divider />
                    <Menu.Item
                      leadingIcon="delete"
                      onPress={handleDeleteWorkout}
                      title="Delete"
                      titleStyle={{ color: Colors[colorScheme].error }}
                    />
                  </Menu>
                </View>
              </View>
            )}
          </View>

          <View style={styles.exercisesContainer}>
            {workout.exercises.length > 0 ? (
              <View>
                {workout.exercises.map((exercise, index) => (
                  <WorkoutExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    onDelete={() => onDeleteExercise(workout.id, exercise.id)}
                    onEditSets={(sets) => onEditSets(workout.id, exercise.id, sets)}
                    onEditReps={(reps) => onEditReps(workout.id, exercise.id, reps)}
                  />
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: Colors[colorScheme].textDim }]}>
                No exercises in this workout
              </Text>
            )}
          </View>

          <View style={styles.addButtonContainer}>
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: Colors[colorScheme].primary }
              ]}
              onPress={onNavigateToExercises}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </Pressable>
          </View>
        </Card.Content>
      </Card>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    elevation: 2,
    borderRadius: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  menuContainer: {
    alignItems: 'flex-end',
  },
  renameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  renameInput: {
    flex: 1,
    height: 40,
  },
  renameButton: {
    marginLeft: 5,
  },
  exercisesContainer: {
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  addButtonContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  deleteContainer: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WorkoutCard; 