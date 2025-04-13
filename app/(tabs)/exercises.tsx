import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, ScrollView, View, Image, TextInput, ActivityIndicator, Animated, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { Chip, Text, Card, Button, TouchableRipple, IconButton, Menu, Divider, Surface, Searchbar, Portal, Dialog, RadioButton, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getExercises, getExerciseTypes, getDifficultyLevels, getMuscleGroups, Exercise } from '../../services/exercisesService';
import { AuthContext } from '../_layout';
import { Workout, getUserWorkouts, addExerciseToWorkout, updateWorkoutInLocalCache } from '../../services/workoutService';

// Define error color for the app
const ERROR_COLOR = '#FF5252';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARDS_PER_ROW = 2;
const CARD_WIDTH = (width - (CARDS_PER_ROW + 1) * CARD_MARGIN * 2) / CARDS_PER_ROW;

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Helper functions
function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
}

function getDifficultyChipStyle(difficulty: string, theme: 'light' | 'dark') {
  let backgroundColor, textColor;
  
  switch(difficulty) {
    case 'beginner':
      backgroundColor = theme === 'light' ? '#E3F2FD' : '#0D47A1';
      textColor = theme === 'light' ? '#0D47A1' : '#FFFFFF';
      break;
    case 'intermediate':
      backgroundColor = theme === 'light' ? '#FFF3E0' : '#E65100';
      textColor = theme === 'light' ? '#E65100' : '#FFFFFF';
      break;
    case 'expert':
      backgroundColor = theme === 'light' ? '#FFEBEE' : '#B71C1C';
      textColor = theme === 'light' ? '#B71C1C' : '#FFFFFF';
      break;
    default:
      backgroundColor = theme === 'light' ? '#F5F5F5' : '#424242';
      textColor = theme === 'light' ? '#424242' : '#FFFFFF';
  }
  
  return {
    backgroundColor,
    color: textColor
  };
}

function getTypeChipStyle(type: string, theme: 'light' | 'dark') {
  let backgroundColor, textColor, icon;
  
  switch(type) {
    case 'cardio':
      backgroundColor = theme === 'light' ? '#E8F5E9' : '#1B5E20';
      textColor = theme === 'light' ? '#1B5E20' : '#FFFFFF';
      icon = 'heart-outline';
      break;
    case 'olympic_weightlifting':
      backgroundColor = theme === 'light' ? '#E1F5FE' : '#01579B';
      textColor = theme === 'light' ? '#01579B' : '#FFFFFF';
      icon = 'barbell-outline';
      break;
    case 'plyometrics':
      backgroundColor = theme === 'light' ? '#F3E5F5' : '#6A1B9A';
      textColor = theme === 'light' ? '#6A1B9A' : '#FFFFFF';
      icon = 'flash-outline';
      break;
    case 'powerlifting':
      backgroundColor = theme === 'light' ? '#FFEBEE' : '#B71C1C';
      textColor = theme === 'light' ? '#B71C1C' : '#FFFFFF';
      icon = 'barbell-outline';
      break;
    case 'strength':
      backgroundColor = theme === 'light' ? '#FFF3E0' : '#E65100';
      textColor = theme === 'light' ? '#E65100' : '#FFFFFF';
      icon = 'fitness-outline';
      break;
    case 'stretching':
      backgroundColor = theme === 'light' ? '#E0F7FA' : '#006064';
      textColor = theme === 'light' ? '#006064' : '#FFFFFF';
      icon = 'body-outline';
      break;
    case 'strongman':
      backgroundColor = theme === 'light' ? '#EFEBE9' : '#4E342E';
      textColor = theme === 'light' ? '#4E342E' : '#FFFFFF';
      icon = 'body-outline';
      break;
    default:
      backgroundColor = theme === 'light' ? '#F5F5F5' : '#424242';
      textColor = theme === 'light' ? '#424242' : '#FFFFFF';
      icon = 'fitness-outline';
  }
  
  return {
    backgroundColor,
    color: textColor,
    icon
  };
}

// Add this function to group exercises by type/muscle
const groupExercisesByCategory = (exercises: Exercise[], groupBy: 'type' | 'muscle' | 'difficulty' = 'type') => {
  const grouped: Record<string, Exercise[]> = {};
  
  exercises.forEach(exercise => {
    const key = exercise[groupBy];
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(exercise);
  });
  
  return grouped;
};

export default function ExercisesScreen() {
  const { muscle, workoutId, workoutDay, existingExercises, filterByMuscle, key } = useLocalSearchParams<{ 
    muscle: string;
    workoutId: string;
    workoutDay: string;
    existingExercises: string;
    filterByMuscle: string;
    key: string; // Timestamp to force remount
  }>();
  
  const router = useRouter();
  const { user } = useContext(AuthContext) as { user: { uid: string, email?: string } | null };
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'type' | 'muscle' | 'difficulty'>('type');
  const colorScheme = useColorScheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  
  // Filter options
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(muscle || null);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [difficultyMenuVisible, setDifficultyMenuVisible] = useState(false);
  const [muscleMenuVisible, setMuscleMenuVisible] = useState(false);
  const [filterBarVisible, setFilterBarVisible] = useState(!!muscle);

  // Workout selection
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutDialogVisible, setWorkoutDialogVisible] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(workoutId || null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [setsInput, setSetsInput] = useState('3');
  const [repsInput, setRepsInput] = useState('10');
  const [selectedDay, setSelectedDay] = useState<string>(workoutDay || getCurrentDay());
  
  // Parse existing exercises if provided
  const [existingExerciseNames, setExistingExerciseNames] = useState<string[]>([]);
  
  useEffect(() => {
    if (existingExercises) {
      try {
        const parsedExercises = JSON.parse(existingExercises);
        setExistingExerciseNames(parsedExercises);
      } catch (e) {
        console.error('Error parsing existing exercises:', e);
      }
    }
  }, [existingExercises]);

  // Add success notification state
  const [successVisible, setSuccessVisible] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  const exerciseTypes = getExerciseTypes();
  const difficultyLevels = getDifficultyLevels();
  const muscleGroups = getMuscleGroups();

  // Calculate header height based on filter visibility
  const baseHeaderHeight = 120; // Height without filters
  const filtersHeight = 150; // Additional height for filters
  
  // Animation for header
  const headerHeight = useRef(new Animated.Value(filterBarVisible ? baseHeaderHeight + filtersHeight : baseHeaderHeight)).current;

  // Update header height animation when filter visibility changes
  useEffect(() => {
    Animated.timing(headerHeight, {
      toValue: filterBarVisible ? baseHeaderHeight + filtersHeight : baseHeaderHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [filterBarVisible]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  // Enhanced muscle filtering with immediate execution on mount
  useEffect(() => {
    // Force immediate refresh with proper loading state
    setLoading(true);
    
    // Log all received parameters
    console.log("==== ExercisesScreen Refreshing ====");
    console.log("- Received key:", key);
    console.log("- Received muscle:", muscle);
    console.log("- Received workoutId:", workoutId);
    
    // Pre-select workout if provided
    if (workoutId) {
      setSelectedWorkoutId(workoutId);
      console.log("Pre-selected workout ID:", workoutId);
    }
    
    // Always apply muscle filter when it's provided
    if (muscle) {
      console.log(`Setting muscle filter to: ${muscle}`);
      setSelectedMuscle(muscle);
      setFilterBarVisible(true);
      
      // Immediate filtering with the muscle parameter
      const immediateFilter = async () => {
        try {
          const params: any = { muscle };
          console.log("Immediately filtering by muscle:", muscle);
          
          const data = await getExercises(params);
          console.log(`Found ${data.length} exercises for muscle: ${muscle}`);
          
          // Set the exercises state with filtered results
          setExercises(data);
        } catch (err) {
          console.error('Error in initial muscle filter:', err);
          setError('Failed to filter exercises by muscle group.');
        } finally {
          setLoading(false);
        }
      };
      
      // Execute immediately to avoid any delay
      immediateFilter();
    } else {
      // No muscle filter, fetch all exercises
      fetchExercises().finally(() => {
        setLoading(false);
      });
    }
  }, [key, muscle, workoutId]); // Add workoutId to dependencies to refresh when it changes

  // Fetch exercises with filters
  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (searchQuery) params.name = searchQuery;
      if (selectedType) params.type = selectedType;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (selectedMuscle) params.muscle = selectedMuscle;
      
      console.log("Fetching exercises with params:", params);
      const data = await getExercises(params);
      console.log(`Found ${data.length} exercises`);
      setExercises(data);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to fetch exercises. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    console.log("Filter changed, re-fetching exercises");
    console.log("- Type:", selectedType);
    console.log("- Muscle:", selectedMuscle);
    console.log("- Difficulty:", selectedDifficulty);
    fetchExercises();
  }, [selectedType, selectedDifficulty, selectedMuscle]);

  // For immediate search input responses
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchExercises();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Animation for modal
  useEffect(() => {
    if (selectedExercise) {
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedExercise]);

  // Fetch user workouts
  useEffect(() => {
    if (user) {
      fetchUserWorkouts();
    }
  }, [user, workoutId]);

  // Add this to refresh workouts when the tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log("Exercises tab focused, refreshing workouts");
        fetchUserWorkouts();
      }
      return () => {};
    }, [user])
  );

  const fetchUserWorkouts = async () => {
    if (!user) return;
    
    try {
      console.log("Fetching workouts for user:", user.uid);
      const userWorkouts = await getUserWorkouts(user.uid);
      console.log("Fetched workouts:", userWorkouts.length);
      setWorkouts(userWorkouts);
      
      // If workoutId is provided, make sure it's selected
      if (workoutId) {
        setSelectedWorkoutId(workoutId);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  // Get current day of the week
  function getCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }

  // Get workouts for the selected day
  const getWorkoutsForDay = (day: string) => {
    return workouts.filter(workout => workout.day === day);
  };

  // Animation for success notification
  useEffect(() => {
    if (successVisible) {
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setSuccessVisible(false);
      });
    }
  }, [successVisible]);

  // Success notification animations
  const successOpacity = successAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const successScale = successAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  // Add exercise to workout function
  const addToWorkout = async () => {
    // Determine which workout ID to use
    // 1. If we navigated here directly from the workouts tab with a specific workoutId, use that
    // 2. Otherwise, use the workout the user selected in the dialog
    const targetWorkoutId = workoutId || selectedWorkoutId;
    
    if (!selectedExercise || !targetWorkoutId || !user) {
      Alert.alert("Error", "Please select a workout to add this exercise to.");
      return;
    }

    console.log(`Adding exercise to workout - Target Workout ID: ${targetWorkoutId}, Original Workout ID from params: ${workoutId}`);
    setAddingExercise(true);
    
    try {
      const sets = parseInt(setsInput, 10) || 3;
      const reps = parseInt(repsInput, 10) || 10;
      
      // Add the exercise to the server first
      console.log(`Adding exercise ${selectedExercise.name} to workout ${targetWorkoutId} (from URL: ${workoutId ? 'yes' : 'no'})`);
      await addExerciseToWorkout(
        targetWorkoutId, 
        selectedExercise,
        sets,
        reps
      );
      
      // After adding to server, refresh our workouts to get the updated data
      await fetchUserWorkouts();
      
      // Update our local state to show immediate feedback
      setWorkoutDialogVisible(false);
      setSelectedExercise(null);
      
      // Add to existing exercises list so it's marked as already added
      setExistingExerciseNames([...existingExerciseNames, selectedExercise.name]);
      
      // Show success notification
      setSuccessVisible(true);
      
      // Hide success notification after 2 seconds
      setTimeout(() => {
        setSuccessVisible(false);
        // If we came from a workout, navigate back to it with its ID
        if (workoutId) {
          console.log("Navigating back to workouts with ID:", workoutId);
          router.push({
            pathname: '/(tabs)/workouts',
            params: {
              refreshWorkouts: 'true',
              selectedWorkoutId: targetWorkoutId.toString() // Use targetWorkoutId which is what we actually used
            }
          });
        } else if (selectedWorkoutId) {
          // When user selected a workout from the dialog
          router.push({
            pathname: '/(tabs)/workouts',
            params: {
              refreshWorkouts: 'true',
              selectedWorkoutId: targetWorkoutId.toString() // Use targetWorkoutId
            }
          });
        } else {
          // Just navigate to workouts tab without selecting a workout
          router.push({
            pathname: '/(tabs)/workouts',
            params: {
              refreshWorkouts: 'true'
            }
          });
        }
      }, 2000);
    } catch (error) {
      console.error('Error adding exercise to workout:', error);
      Alert.alert('Error', 'Failed to add exercise to workout. Please try again.');
    } finally {
      setAddingExercise(false);
    }
  };

  // Handle the "Add to Workout" button click
  const handleAddToWorkoutClick = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add exercises to workouts.');
      return;
    }
    
    // If workoutId is provided from a direct navigation (not from user selecting
    // a different workout in dialog), use it directly
    if (workoutId && selectedWorkoutId !== workoutId) {
      console.log(`Using workout ID from URL params: ${workoutId}`);
      // Set selectedWorkoutId to match the workoutId from params
      setSelectedWorkoutId(workoutId);
      addToWorkout();
    } else {
      console.log('Showing workout selection dialog');
      // Always show the dialog if user has previously interacted with it or no workoutId is provided
      setWorkoutDialogVisible(true);
    }
  };

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const closeExerciseDetails = () => {
    setSelectedExercise(null);
  };

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedDifficulty(null);
    setSelectedMuscle(null);
    setSearchQuery('');
  };

  const modalTranslateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const modalBackdropOpacity = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  // Generate random image URLs for each exercise
  const getExerciseImage = (exerciseName: string, muscle: string) => {
    const muscles = ['abs', 'back', 'biceps', 'chest', 'legs', 'shoulders'];
    const muscleCategory = muscle.includes('quad') || muscle.includes('hamstring') ? 'legs' : 
                         muscle.includes('chest') ? 'chest' :
                         muscle.includes('bicep') ? 'biceps' :
                         muscle.includes('back') || muscle.includes('lat') ? 'back' :
                         muscle.includes('shoulder') || muscle.includes('trap') ? 'shoulders' :
                         muscle.includes('ab') ? 'abs' : 'back';
    
    return `https://source.unsplash.com/featured/?fitness,${muscleCategory},exercise`;
  };

  const toggleFilterBar = () => {
    setFilterBarVisible(!filterBarVisible);
  };

  // Calculate padding based on header height for scrollview
  const scrollViewPadding = headerHeight.interpolate({
    inputRange: [baseHeaderHeight, baseHeaderHeight + filtersHeight],
    outputRange: [baseHeaderHeight, baseHeaderHeight + filtersHeight],
    extrapolate: 'clamp',
  });

  // Modify renderGroupedExercises to handle existing exercises
  const renderGroupedExercises = () => {
    if (loading) {
      return (
        <View style={styles.centerContentContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 16, color: Colors[colorScheme ?? 'light'].text }}>
            Loading exercises...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContentContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF6B6B" />
          <Text style={{ marginTop: 16, color: Colors[colorScheme ?? 'light'].text }}>
            {error}
          </Text>
          <Button 
            mode="contained" 
            onPress={fetchExercises} 
            style={{ marginTop: 20 }}
          >
            Try Again
          </Button>
        </View>
      );
    }

    if (exercises.length === 0) {
      return (
        <View style={styles.centerContentContainer}>
          <Ionicons 
            name="fitness-outline" 
            size={64} 
            color={Colors[colorScheme ?? 'light'].mutedText} 
          />
          <Text style={{ 
            marginTop: 16, 
            color: Colors[colorScheme ?? 'light'].text,
            fontSize: 18,
            textAlign: 'center' 
          }}>
            No exercises found
          </Text>
          <Text style={{ 
            marginTop: 8, 
            color: Colors[colorScheme ?? 'light'].mutedText,
            textAlign: 'center',
            paddingHorizontal: 24
          }}>
            Try adjusting your filters or search query
          </Text>
          <Button 
            mode="contained" 
            onPress={clearFilters} 
            style={{ marginTop: 20 }}
            icon="filter-remove"
          >
            Clear Filters
          </Button>
        </View>
      );
    }

    const groupedExercises = groupExercisesByCategory(exercises, groupBy);
    const categories = Object.keys(groupedExercises).sort();

    return (
      <>
        {categories.map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={[
              styles.categoryTitle, 
              { color: Colors[colorScheme ?? 'light'].text }
            ]}>
              {capitalizeFirstLetter(category)}
            </Text>
            <View style={styles.exerciseGrid}>
              {groupedExercises[category].map((exercise, index) => {
                // Check if this exercise is already in the workout
                const isExistingExercise = existingExerciseNames.includes(exercise.name);
                
                return (
                <Card
                  key={`${exercise.name}-${index}`}
                  style={[
                    styles.exerciseCard,
                    isExistingExercise && { 
                      opacity: 0.6,
                      borderWidth: 1,
                      borderColor: ERROR_COLOR,
                    }
                  ]}
                  onPress={() => {
                    if (!isExistingExercise) {
                      handleExercisePress(exercise);
                    } else {
                      // Alert user that exercise is already in workout
                      Alert.alert(
                        "Already Added",
                        `${exercise.name} is already in this workout.`
                      );
                    }
                  }}
                >
                  <Image
                    source={{ uri: getExerciseImage(exercise.name, exercise.muscle) }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <Card.Content style={styles.exerciseCardContent}>
                    <View style={styles.chipContainer}>
                      <Chip 
                        mode="flat" 
                        style={getDifficultyChipStyle(exercise.difficulty, colorScheme ?? 'light')}
                        compact
                      >
                        {capitalizeFirstLetter(exercise.difficulty)}
                      </Chip>
                      <Chip 
                        mode="flat"
                        compact 
                        style={getTypeChipStyle(exercise.type, colorScheme ?? 'light')}
                        icon={() => <Ionicons name={getTypeChipStyle(exercise.type, colorScheme ?? 'light').icon as any} size={14} color={getTypeChipStyle(exercise.type, colorScheme ?? 'light').color} />}
                      >
                        {exercise.type.replace('_', ' ')}
                      </Chip>
                    </View>
                    {isExistingExercise && (
                      <View style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: ERROR_COLOR,
                        borderRadius: 12,
                        padding: 2,
                      }}>
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                      </View>
                    )}
                    <Text variant="titleMedium" style={{ color: Colors[colorScheme ?? 'light'].text, fontWeight: 'bold' }} numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: Colors[colorScheme ?? 'light'].mutedText }} numberOfLines={1}>
                      {capitalizeFirstLetter(exercise.muscle)}
                    </Text>
                    <View style={styles.exerciseMetaInfo}>
                      <Text variant="bodySmall" style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
                        {capitalizeFirstLetter(exercise.equipment)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )})}
            </View>
          </View>
        ))}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Animated.View style={[
        styles.header, 
        { 
          height: headerHeight,
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          zIndex: 10,
          backgroundColor: Colors[colorScheme ?? 'light'].background 
        }
      ]}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {workoutId && (
              <IconButton
                icon="arrow-left"
                size={24} 
                onPress={() => {
                  // Go back to workouts screen with the selected workout
                  router.push({
                    pathname: '/(tabs)/workouts',
                    params: {
                      refreshWorkouts: 'true',
                      selectedWorkoutId: workoutId.toString()
                    }
                  });
                }}
                style={{ marginRight: 4, marginLeft: -8 }}
                iconColor={Colors[colorScheme ?? 'light'].text}
              />
            )}
            <Text variant="headlineMedium" style={{ color: Colors[colorScheme ?? 'light'].text, fontWeight: 'bold' }}>
              Exercises
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <IconButton
                  icon="sort-variant"
                  mode="contained"
                  size={24}
                  onPress={() => setTypeMenuVisible(true)}
                  style={{ backgroundColor: Colors[colorScheme ?? 'light'].tint + '20', marginRight: 8 }}
                  iconColor={Colors[colorScheme ?? 'light'].tint}
                />
              }
            >
              <Menu.Item 
                onPress={() => {
                  setGroupBy('type');
                  setTypeMenuVisible(false);
                }} 
                title="Group by Type"
                leadingIcon={groupBy === 'type' ? 'check' : undefined}
              />
              <Menu.Item 
                onPress={() => {
                  setGroupBy('muscle');
                  setTypeMenuVisible(false);
                }} 
                title="Group by Muscle" 
                leadingIcon={groupBy === 'muscle' ? 'check' : undefined}
              />
              <Menu.Item 
                onPress={() => {
                  setGroupBy('difficulty');
                  setTypeMenuVisible(false);
                }} 
                title="Group by Difficulty" 
                leadingIcon={groupBy === 'difficulty' ? 'check' : undefined}
              />
            </Menu>
            
            <IconButton
              icon="filter-variant"
              mode="contained"
              size={24}
              onPress={toggleFilterBar}
              style={{ backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }}
              iconColor={Colors[colorScheme ?? 'light'].tint}
            />
          </View>
        </View>
        
        <Searchbar
          placeholder="Search exercises..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
          inputStyle={{ color: Colors[colorScheme ?? 'light'].text }}
          placeholderTextColor={Colors[colorScheme ?? 'light'].mutedText}
          iconColor={Colors[colorScheme ?? 'light'].mutedText}
        />
        
        {filterBarVisible && (
          <Animated.View 
            style={[styles.filterContainer, { opacity: headerOpacity }]}
          >
            <View style={styles.filterButtons}>
              <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                  <Button 
                    mode={selectedType ? "contained" : "outlined"}
                    icon="dumbbell" 
                    onPress={() => setTypeMenuVisible(true)}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                    compact
                  >
                    {selectedType ? selectedType.replace('_', ' ') : "Type"}
                  </Button>
                }
              >
                {exerciseTypes.map((type) => (
                  <Menu.Item
                    key={type}
                    onPress={() => {
                      setSelectedType(type);
                      setTypeMenuVisible(false);
                    }}
                    title={type.replace('_', ' ')}
                    leadingIcon={selectedType === type ? "check" : undefined}
                  />
                ))}
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setSelectedType(null);
                    setTypeMenuVisible(false);
                  }}
                  title="Clear type"
                  leadingIcon="close"
                />
              </Menu>
              
              <Menu
                visible={muscleMenuVisible}
                onDismiss={() => setMuscleMenuVisible(false)}
                anchor={
                  <Button 
                    mode={selectedMuscle ? "contained" : "outlined"}
                    icon="muscle" 
                    onPress={() => setMuscleMenuVisible(true)}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                    compact
                  >
                    {selectedMuscle ? capitalizeFirstLetter(selectedMuscle) : "Muscle"}
                  </Button>
                }
              >
                {muscleGroups.map((muscle) => (
                  <Menu.Item
                    key={muscle}
                    onPress={() => {
                      setSelectedMuscle(muscle);
                      setMuscleMenuVisible(false);
                    }}
                    title={capitalizeFirstLetter(muscle)}
                    leadingIcon={selectedMuscle === muscle ? "check" : undefined}
                  />
                ))}
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setSelectedMuscle(null);
                    setMuscleMenuVisible(false);
                  }}
                  title="Clear muscle"
                  leadingIcon="close"
                />
              </Menu>
              
              <Menu
                visible={difficultyMenuVisible}
                onDismiss={() => setDifficultyMenuVisible(false)}
                anchor={
                  <Button 
                    mode={selectedDifficulty ? "contained" : "outlined"}
                    icon="stairs" 
                    onPress={() => setDifficultyMenuVisible(true)}
                    style={styles.filterButton}
                    contentStyle={styles.filterButtonContent}
                    compact
                  >
                    {selectedDifficulty ? capitalizeFirstLetter(selectedDifficulty) : "Difficulty"}
                  </Button>
                }
              >
                {difficultyLevels.map((level) => (
                  <Menu.Item
                    key={level}
                    onPress={() => {
                      setSelectedDifficulty(level);
                      setDifficultyMenuVisible(false);
                    }}
                    title={capitalizeFirstLetter(level)}
                    leadingIcon={selectedDifficulty === level ? "check" : undefined}
                  />
                ))}
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setSelectedDifficulty(null);
                    setDifficultyMenuVisible(false);
                  }}
                  title="Clear difficulty"
                  leadingIcon="close"
                />
              </Menu>
              
              {(selectedType || selectedDifficulty || selectedMuscle || searchQuery) && (
                <Button 
                  mode="text" 
                  icon="filter-remove" 
                  onPress={clearFilters}
                  style={styles.filterButton}
                  contentStyle={styles.filterButtonContent}
                  compact
                >
                  Clear
                </Button>
              )}
            </View>
            
            {(selectedType || selectedDifficulty || selectedMuscle) && (
              <View style={styles.activeFilters}>
                {selectedType && (
                  <Chip 
                    icon="dumbbell"
                    onClose={() => setSelectedType(null)}
                    style={styles.filterChip}
                    compact
                  >
                    {selectedType.replace('_', ' ')}
                  </Chip>
                )}
                {selectedMuscle && (
                  <Chip 
                    icon="muscle"
                    onClose={() => setSelectedMuscle(null)}
                    style={styles.filterChip}
                    compact
                  >
                    {capitalizeFirstLetter(selectedMuscle)}
                  </Chip>
                )}
                {selectedDifficulty && (
                  <Chip 
                    icon="stairs"
                    onClose={() => setSelectedDifficulty(null)}
                    style={styles.filterChip}
                    compact
                  >
                    {capitalizeFirstLetter(selectedDifficulty)}
                  </Chip>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingTop: filterBarVisible ? baseHeaderHeight + filtersHeight + 20 : baseHeaderHeight + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderGroupedExercises()}
      </Animated.ScrollView>

      {selectedExercise && (
        <>
          <Animated.View 
            style={[
              styles.modalBackdrop, 
              { 
                opacity: modalBackdropOpacity,
                backgroundColor: 'black'
              }
            ]}
            pointerEvents={selectedExercise ? 'auto' : 'none'}
            onTouchEnd={closeExerciseDetails}
          />
          <Animated.View 
            style={[
              styles.modal, 
              { 
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                transform: [{ translateY: modalTranslateY }] 
              }
            ]}
          >
            <View style={styles.modalHandle} />
            
            <IconButton 
              icon="close" 
              size={24} 
              style={styles.closeIcon}
              onPress={closeExerciseDetails}
            />
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Image 
                source={{ uri: getExerciseImage(selectedExercise.name, selectedExercise.muscle) }}
                style={styles.modalImage}
              />
              
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text variant="headlineMedium" style={{ color: Colors[colorScheme ?? 'light'].text, fontWeight: 'bold' }}>
                    {selectedExercise.name}
                  </Text>
                  <View style={styles.modalTags}>
                    <Chip 
                      style={getDifficultyChipStyle(selectedExercise.difficulty, colorScheme ?? 'light')}
                      mode="flat"
                    >
                      {capitalizeFirstLetter(selectedExercise.difficulty)}
                    </Chip>
                    <Chip 
                      style={getTypeChipStyle(selectedExercise.type, colorScheme ?? 'light')}
                      icon={() => <Ionicons name={getTypeChipStyle(selectedExercise.type, colorScheme ?? 'light').icon as any} size={16} color={getTypeChipStyle(selectedExercise.type, colorScheme ?? 'light').color} />}
                      mode="flat"
                    >
                      {selectedExercise.type.replace('_', ' ')}
                    </Chip>
                  </View>
                  <Text variant="titleMedium" style={{ color: Colors[colorScheme ?? 'light'].mutedText, marginTop: 8 }}>
                    {capitalizeFirstLetter(selectedExercise.muscle)} • {capitalizeFirstLetter(selectedExercise.equipment)}
                  </Text>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.exerciseDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="body-outline" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text variant="bodyMedium" style={{ color: Colors[colorScheme ?? 'light'].text, marginLeft: 8 }}>
                      Targets {capitalizeFirstLetter(selectedExercise.muscle)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name={selectedExercise.equipment === 'body_only' ? 'person-outline' : 'barbell-outline'} size={24} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text variant="bodyMedium" style={{ color: Colors[colorScheme ?? 'light'].text, marginLeft: 8 }}>
                      Uses {capitalizeFirstLetter(selectedExercise.equipment)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="fitness-outline" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text variant="bodyMedium" style={{ color: Colors[colorScheme ?? 'light'].text, marginLeft: 8 }}>
                      {capitalizeFirstLetter(selectedExercise.type)} exercise
                    </Text>
                  </View>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.modalSection}>
                  <Text variant="titleLarge" style={{ color: Colors[colorScheme ?? 'light'].text, marginBottom: 10 }}>
                    Instructions
                  </Text>
                  <Text variant="bodyLarge" style={{ color: Colors[colorScheme ?? 'light'].text, lineHeight: 24 }}>
                    {selectedExercise.instructions}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <Button
              mode="contained"
              style={styles.addButton}
              icon="plus"
              loading={addingExercise}
              disabled={addingExercise || !user}
              onPress={handleAddToWorkoutClick}
            >
              Add to Workout
            </Button>
          </Animated.View>
        </>
      )}

      <Portal>
        <Dialog visible={workoutDialogVisible} onDismiss={() => setWorkoutDialogVisible(false)}>
          <Dialog.Title>Add to Workout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Select day:
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDay === day && styles.selectedDayButton,
                      { 
                        backgroundColor: selectedDay === day 
                          ? Colors[colorScheme ?? 'light'].tint 
                          : Colors[colorScheme ?? 'light'].cardBackground
                      }
                    ]}
                    onPress={() => {
                      setSelectedDay(day);
                      setSelectedWorkoutId(null); // Reset selection when changing day
                      
                      // Refresh workouts list to ensure we have all workouts
                      fetchUserWorkouts();
                    }}
                  >
                    <Text 
                      style={[
                        styles.dayButtonText,
                        { 
                          color: selectedDay === day 
                            ? 'white' 
                            : Colors[colorScheme ?? 'light'].text
                        }
                      ]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <Divider style={{ marginVertical: 8 }} />
            
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Select a workout for {selectedDay}:
            </Text>
            
            {getWorkoutsForDay(selectedDay).length === 0 ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Ionicons 
                  name="barbell-outline" 
                  size={40} 
                  color={Colors[colorScheme ?? 'light'].mutedText} 
                />
                <Text style={{ 
                  color: Colors[colorScheme ?? 'light'].mutedText, 
                  marginTop: 8, 
                  marginBottom: 16, 
                  textAlign: 'center' 
                }}>
                  No workouts found for {selectedDay}.
                </Text>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setWorkoutDialogVisible(false);
                    closeExerciseDetails();
                    router.push({
                      pathname: '/(tabs)/workouts',
                      params: { 
                        createForDay: selectedDay,
                        showWorkoutDialog: 'true'
                      }
                    });
                  }}
                >
                  Create Workout
                </Button>
              </View>
            ) : (
              <RadioButton.Group 
                onValueChange={value => {
                  console.log('Selected workout ID changed to:', value);
                  setSelectedWorkoutId(value);
                }} 
                value={selectedWorkoutId || ''}
              >
                {getWorkoutsForDay(selectedDay).map(workout => (
                  <RadioButton.Item
                    key={workout.id}
                    label={workout.name}
                    value={workout.id || ''}
                    style={{ paddingVertical: 8 }}
                  />
                ))}
              </RadioButton.Group>
            )}
            
            <Divider style={{ marginVertical: 16 }} />
            
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Sets:
            </Text>
            <TextInput
              value={setsInput}
              onChangeText={setSetsInput}
              keyboardType="number-pad"
              style={[
                styles.exerciseInput,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
              ]}
              placeholder="Number of sets (default: 3)"
            />
            
            <Text variant="bodyMedium" style={{ marginTop: 16, marginBottom: 8 }}>
              Reps:
            </Text>
            <TextInput
              value={repsInput}
              onChangeText={setRepsInput}
              keyboardType="number-pad"
              style={[
                styles.exerciseInput,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
              ]}
              placeholder="Number of reps (default: 10)"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWorkoutDialogVisible(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={addToWorkout}
              disabled={!selectedWorkoutId || addingExercise || getWorkoutsForDay(selectedDay).length === 0}
              loading={addingExercise}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {successVisible && (
        <Animated.View 
          style={[
            styles.successNotification,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
              backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
            }
          ]}
        >
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
          </View>
          <Text style={styles.successText}>Exercise added successfully!</Text>
        </Animated.View>
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
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    elevation: 0,
    marginBottom: 12,
    borderRadius: 12,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  filterButton: {
    marginRight: 8,
    borderRadius: 20,
  },
  filterButtonContent: {
    height: 36,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  exerciseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exerciseCard: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: CARD_MARGIN,
    borderRadius: 12,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  cardImage: {
    height: 140,
  },
  exerciseCardContent: {
    padding: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  exerciseTypeWrapper: {
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  exerciseMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  typeChip: {
    height: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CCCCCC',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1001,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalScrollView: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  divider: {
    marginVertical: 16,
  },
  exerciseDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  modalSection: {
    marginBottom: 24,
  },
  addButton: {
    margin: 16,
    borderRadius: 8,
  },
  exerciseInput: {
    height: 45,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedDayButton: {
    borderWidth: 0,
  },
  dayButtonText: {
    fontWeight: '500',
  },
  categorySection: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  categoryTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    paddingVertical: 8,
  },
  successNotification: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 220,
    height: 220,
    marginLeft: -110,
    marginTop: -110,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 500, // Ensure it takes enough space to center content
  },
}); 