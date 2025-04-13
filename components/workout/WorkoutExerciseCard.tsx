import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton, TextInput } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SavedExercise } from '@/types';

interface WorkoutExerciseCardProps {
  exercise: SavedExercise;
  index: number;
  onDelete: () => void;
  onEditSets: (sets: number) => void;
  onEditReps: (reps: number) => void;
}

const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  index,
  onDelete,
  onEditSets,
  onEditReps,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const [editingSets, setEditingSets] = useState(false);
  const [editingReps, setEditingReps] = useState(false);
  const [sets, setSets] = useState(exercise.sets.toString());
  const [reps, setReps] = useState(exercise.reps.toString());
  const swipeableRef = React.useRef<Swipeable>(null);

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleSetsSubmit = () => {
    const parsedSets = parseInt(sets, 10);
    if (!isNaN(parsedSets) && parsedSets > 0) {
      onEditSets(parsedSets);
    } else {
      setSets(exercise.sets.toString());
    }
    setEditingSets(false);
  };

  const handleRepsSubmit = () => {
    const parsedReps = parseInt(reps, 10);
    if (!isNaN(parsedReps) && parsedReps > 0) {
      onEditReps(parsedReps);
    } else {
      setReps(exercise.reps.toString());
    }
    setEditingReps(false);
  };

  const renderRightActions = () => (
    <View style={styles.deleteContainer}>
      <Pressable
        onPress={() => {
          closeSwipeable();
          onDelete();
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
      <View
        style={[
          styles.container,
          {
            backgroundColor: index % 2 === 0 
              ? Colors[colorScheme].cardBackground 
              : Colors[colorScheme].background
          }
        ]}
      >
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: Colors[colorScheme].text }]}>
            {exercise.name}
          </Text>
        </View>
        
        <View style={styles.setsRepsContainer}>
          <View style={styles.countContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme].textDim }]}>Sets</Text>
            {editingSets ? (
              <View style={styles.editContainer}>
                <TextInput
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  dense
                  autoFocus
                />
                <IconButton
                  icon="check"
                  size={16}
                  onPress={handleSetsSubmit}
                  style={styles.editButton}
                />
              </View>
            ) : (
              <Pressable onPress={() => setEditingSets(true)}>
                <View style={styles.valueContainer}>
                  <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
                    {exercise.sets}
                  </Text>
                  <Ionicons name="pencil" size={14} color={Colors[colorScheme].textDim} />
                </View>
              </Pressable>
            )}
          </View>
          
          <View style={styles.countContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme].textDim }]}>Reps</Text>
            {editingReps ? (
              <View style={styles.editContainer}>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  dense
                  autoFocus
                />
                <IconButton
                  icon="check"
                  size={16}
                  onPress={handleRepsSubmit}
                  style={styles.editButton}
                />
              </View>
            ) : (
              <Pressable onPress={() => setEditingReps(true)}>
                <View style={styles.valueContainer}>
                  <Text style={[styles.value, { color: Colors[colorScheme].text }]}>
                    {exercise.reps}
                  </Text>
                  <Ionicons name="pencil" size={14} color={Colors[colorScheme].textDim} />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginVertical: 2,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontWeight: '500',
  },
  setsRepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countContainer: {
    alignItems: 'center',
    marginLeft: 16,
    minWidth: 50,
  },
  label: {
    fontSize: 12,
    marginBottom: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 30,
    width: 50,
  },
  editButton: {
    margin: 0,
    padding: 0,
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

export default WorkoutExerciseCard; 