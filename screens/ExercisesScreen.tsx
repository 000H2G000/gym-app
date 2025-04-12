import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getExercises, getExerciseTypes, getMuscleGroups, getDifficultyLevels, Exercise } from '../services/exercisesService';

const ExercisesScreen = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchName) params.name = searchName;
      if (selectedType) params.type = selectedType;
      if (selectedMuscle) params.muscle = selectedMuscle;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const data = await getExercises(params);
      setExercises(data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [searchName, selectedType, selectedMuscle, selectedDifficulty]);

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseDetail}>Type: {item.type}</Text>
      <Text style={styles.exerciseDetail}>Muscle: {item.muscle}</Text>
      <Text style={styles.exerciseDetail}>Equipment: {item.equipment}</Text>
      <Text style={styles.exerciseDetail}>Difficulty: {item.difficulty}</Text>
      <Text style={styles.instructions}>{item.instructions}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercises</Text>
      
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name"
          value={searchName}
          onChangeText={setSearchName}
        />

        <Picker
          selectedValue={selectedType}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedType(itemValue)}
        >
          <Picker.Item label="All Types" value="" />
          {getExerciseTypes().map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>

        <Picker
          selectedValue={selectedMuscle}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedMuscle(itemValue)}
        >
          <Picker.Item label="All Muscles" value="" />
          {getMuscleGroups().map((muscle) => (
            <Picker.Item key={muscle} label={muscle} value={muscle} />
          ))}
        </Picker>

        <Picker
          selectedValue={selectedDifficulty}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedDifficulty(itemValue)}
        >
          <Picker.Item label="All Difficulties" value="" />
          {getDifficultyLevels().map((difficulty) => (
            <Picker.Item key={difficulty} label={difficulty} value={difficulty} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  exerciseItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exerciseDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ExercisesScreen; 