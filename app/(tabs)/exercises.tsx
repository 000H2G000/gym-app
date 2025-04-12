import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import axios from 'axios';

interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  instructions: string;
  imageUrl?: string;
}

export default function ExercisesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const colorScheme = useColorScheme();

  // Mock exercise data - in a real app, you would fetch this from an API
  useEffect(() => {
    const mockExercises: Exercise[] = [
      {
        id: '1',
        name: 'Barbell Bench Press',
        muscle: 'Chest',
        equipment: 'Barbell',
        instructions: 'Lie on a bench, lower the barbell to your chest, then push it back up.',
        imageUrl: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/11/barbell-bench-press-1024x576.jpg',
      },
      {
        id: '2',
        name: 'Squat',
        muscle: 'Legs',
        equipment: 'Barbell',
        instructions: 'Stand with the barbell on your shoulders, bend your knees until your thighs are parallel to the ground, then stand back up.',
        imageUrl: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/04/barbell-full-squat.gif',
      },
      {
        id: '3',
        name: 'Deadlift',
        muscle: 'Back',
        equipment: 'Barbell',
        instructions: 'Bend down and grab the barbell, then stand up straight while holding it.',
        imageUrl: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/10/barbell-deadlift.jpg',
      },
      {
        id: '4',
        name: 'Pull-up',
        muscle: 'Back',
        equipment: 'Pull-up Bar',
        instructions: 'Hang from a bar and pull yourself up until your chin is over the bar.',
        imageUrl: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/01/pull-up.gif',
      },
      {
        id: '5',
        name: 'Push-up',
        muscle: 'Chest',
        equipment: 'Body Weight',
        instructions: 'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up.',
        imageUrl: 'https://www.inspireusafoundation.org/wp-content/uploads/2022/05/push-up.gif',
      },
    ];
    
    setExercises(mockExercises);
    setFilteredExercises(mockExercises);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exercise.muscle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const closeExerciseDetails = () => {
    setSelectedExercise(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Exercises
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            placeholder="Search exercises..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Recommended Exercises
        </Text>

        <View style={styles.exerciseGrid}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseCard,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
              ]}
              onPress={() => handleExercisePress(exercise)}
            >
              {exercise.imageUrl && (
                <Image source={{ uri: exercise.imageUrl }} style={styles.exerciseImage} />
              )}
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {exercise.name}
                </Text>
                <Text style={[styles.exerciseMuscle, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                  {exercise.muscle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedExercise && (
        <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ScrollView>
            {selectedExercise.imageUrl && (
              <Image source={{ uri: selectedExercise.imageUrl }} style={styles.modalImage} />
            )}
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedExercise.name}
              </Text>
              <Text style={[styles.modalSubtitle, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                {selectedExercise.muscle} • {selectedExercise.equipment}
              </Text>
              <Text style={[styles.modalSectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Instructions
              </Text>
              <Text style={[styles.modalInstructions, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedExercise.instructions}
              </Text>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={closeExerciseDetails}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  exerciseCard: {
    width: '46%',
    margin: '2%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  exerciseInfo: {
    padding: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseMuscle: {
    fontSize: 14,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  modalContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalInstructions: {
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 