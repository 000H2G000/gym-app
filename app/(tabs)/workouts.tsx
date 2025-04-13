import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  TouchableOpacity,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Text,
  FAB,
  Card,
  IconButton,
  Dialog,
  Portal,
  Button,
  TextInput,
  Divider,
  List,
  Surface,
  Menu,
  Chip,
  SegmentedButtons,
  RadioButton
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';
import {
  Workout,
  SavedExercise,
  getUserWorkouts,
  createWorkout,
  deleteWorkout,
  updateWorkoutName,
  removeExerciseFromWorkout
} from '../../services/workoutService';
import { getMuscleGroups } from '../../services/exercisesService';
import { GestureHandlerRootView, Swipeable, TouchableWithoutFeedback } from 'react-native-gesture-handler';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Define error color for the app
const ERROR_COLOR = '#FF5252';

// Separate component for swipeable workout card to fix the hooks error
const SwipeableWorkoutCard = ({ workout, onDelete, onSelect }: { 
  workout: Workout; 
  onDelete: (id: string) => void;
  onSelect: (workout: Workout) => void;
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const colorScheme = useColorScheme();
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
        <Ionicons name="trash-outline" size={28} color="white" />
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
                  icon="ellipsis-vertical"
                  onPress={() => {
                    setEditingWorkout(workout);
                    setMenuVisible(true);
                  }}
                />
              }
            >
              <Menu.Item
                leadingIcon="pencil-outline"
                onPress={() => {
                  setMenuVisible(false);
                  setEditingWorkout(null);
                  Alert.alert("Rename", "Please use the edit button from the main screen to rename workouts.");
                }}
                title="Rename"
              />
              <Menu.Item
                leadingIcon="trash-outline"
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
                color={Colors[colorScheme ?? 'light'].mutedText} 
              />
              <Text 
                style={{ 
                  marginLeft: 4, 
                  color: Colors[colorScheme ?? 'light'].mutedText 
                }}
              >
                {workout.exercises.length} exercises
              </Text>
            </View>
            {workout.updatedAt && (
              <Text style={{ color: Colors[colorScheme ?? 'light'].mutedText, fontSize: 12 }}>
                Last updated: {workout.updatedAt.seconds ? new Date(workout.updatedAt.seconds * 1000).toLocaleDateString() : 'Recently'}
              </Text>
            )}
          </View>
          
          {workout.exercises.length > 0 && (
            <View style={styles.previewExercises}>
              {workout.exercises.slice(0, 2).map((exercise, index) => (
                <Text 
                  key={index} 
                  style={{ color: Colors[colorScheme ?? 'light'].text }}
                  numberOfLines={1}
                >
                  • {exercise.name}
                </Text>
              ))}
              {workout.exercises.length > 2 && (
                <Text style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
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

export default function WorkoutsScreen() {
  const router = useRouter();
  const { refreshWorkouts, selectedWorkoutId } = useLocalSearchParams<{ 
    refreshWorkouts: string;
    selectedWorkoutId: string;
  }>();
  const { user } = useContext(AuthContext) as { user: { uid: string, email?: string } | null };
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [workoutNameError, setWorkoutNameError] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDay());
  const [dialogStep, setDialogStep] = useState(1); // 1: name input, 2: muscle selection
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const colorScheme = useColorScheme();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [directNavigation, setDirectNavigation] = useState(true);
  
  // Get all available muscle groups
  const muscleGroups = getMuscleGroups();

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

  // Load user workouts
  useEffect(() => {
    fetchWorkouts();
  }, [user]);

  // Refresh workouts when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log("Workouts tab focused, refreshing data");
        
        // This is a fresh focus (not from a deep link/push)
        if (!router.canGoBack()) {
          console.log("Direct navigation to workouts tab - resetting selection");
          // Reset selected workout when directly navigating to this tab
          setSelectedWorkout(null);
        } else if (!selectedWorkoutId) {
          console.log("No workout ID in params - resetting selection");
          setSelectedWorkout(null);
        }
        
        fetchWorkouts();
      }
      return () => {};
    }, [user, router, selectedWorkoutId])
  );

  // Animate when workout is selected
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Animated.timing(slideAnimation, {
        toValue: selectedWorkout ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Web implementation without useNativeDriver
      Animated.timing(slideAnimation, {
        toValue: selectedWorkout ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [selectedWorkout]);

  // Determine if this is a direct navigation to the tab or a deep link
  useEffect(() => {
    // If params are present, this is not direct navigation
    if (selectedWorkoutId || refreshWorkouts) {
      setDirectNavigation(false);
    } else {
      // Reset selected workout on direct navigation
      setSelectedWorkout(null);
    }
  }, []);

  // Detect refreshWorkouts and selectedWorkoutId parameters
  useEffect(() => {
    if (refreshWorkouts === 'true') {
      fetchWorkouts().then(() => {
        // After refreshing, select the workout if selectedWorkoutId is provided
        if (selectedWorkoutId && workouts.length > 0) {
          const workoutToSelect = workouts.find(w => w.id === selectedWorkoutId);
          if (workoutToSelect) {
            setSelectedWorkout(workoutToSelect);
          } else if (selectedWorkout && !workouts.find(w => w.id === selectedWorkout.id)) {
            // If currently selected workout no longer exists, clear the selection
            setSelectedWorkout(null);
          }
        }
      });
    } else if (directNavigation) {
      // If this is direct navigation to the tab, reset the selected workout
      setSelectedWorkout(null);
    }
  }, [refreshWorkouts, selectedWorkoutId, workouts.length, directNavigation]);
  
  // Handle selectedWorkoutId parameter when workouts are loaded
  useEffect(() => {
    if (selectedWorkoutId && workouts.length > 0) {
      console.log("Trying to select workout with ID:", selectedWorkoutId);
      console.log("Available workout IDs:", workouts.map(w => w.id).join(', '));
      
      // Compare ID strings directly to ensure correct matching
      const workoutToSelect = workouts.find(w => w.id?.toString() === selectedWorkoutId.toString());
      
      if (workoutToSelect) {
        console.log("Found workout to select:", workoutToSelect.name);
        setSelectedWorkout(workoutToSelect);
      } else {
        console.log("Workout with ID not found");
      }
    }
  }, [selectedWorkoutId, workouts]);

  const fetchWorkouts = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      const data = await getUserWorkouts(user.uid);
      setWorkouts(data);
      
      // If we have a selectedWorkoutId from params and have workouts loaded
      if (selectedWorkoutId && data.length > 0) {
        console.log("Fetched workouts, looking for ID:", selectedWorkoutId);
        // Compare ID strings directly
        const workoutToSelect = data.find(w => w.id?.toString() === selectedWorkoutId.toString());
        if (workoutToSelect) {
          console.log("Found and selecting workout:", workoutToSelect.name);
          setSelectedWorkout(workoutToSelect);
        } else {
          console.log("Workout with ID not found in fetched data");
        }
      } else if (selectedWorkout && !data.find(w => w.id === selectedWorkout.id)) {
        // If currently selected workout no longer exists, clear the selection
        setSelectedWorkout(null);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      Alert.alert('Error', 'Failed to load workouts. Please try again.');
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNextStep = () => {
    if (!newWorkoutName.trim()) {
      setWorkoutNameError('Workout name cannot be empty');
      return;
    }
    
    setWorkoutNameError('');
    setDialogStep(2);
  }

  const handleGoBack = () => {
    setDialogStep(1);
  }
  
  const showWorkoutCreationDialog = () => {
    // Reset the dialog state
    setSelectedMuscle('');
    // Skip to the muscle selection screen directly
    setDialogStep(2);
    setDialogVisible(true);
  };

  const handleCreateWorkout = async () => {
    if (!user || !selectedMuscle) return;

    // Auto-generate workout name based on the selected muscle
    const autoWorkoutName = `${capitalizeFirstLetter(selectedMuscle)} Workout`;
    
    try {
      const newWorkout = await createWorkout(user.uid, autoWorkoutName, selectedDay);
      setWorkouts([...workouts, newWorkout]);
      resetWorkoutDialog();
      
      // Navigate to exercises tab with the selected muscle group and set the new workout ID
      console.log("Created new workout, navigating to exercises with muscle:", selectedMuscle);
      router.push({
        pathname: '/(tabs)/exercises',
        params: { 
          muscle: selectedMuscle,
          workoutId: newWorkout.id,
          workoutDay: selectedDay,
          existingExercises: JSON.stringify([])
        }
      });
    } catch (error) {
      console.error('Error creating workout:', error);
      Alert.alert('Error', 'Failed to create workout. Please try again.');
    }
  };
  
  const resetWorkoutDialog = () => {
    setDialogVisible(false);
    setDialogStep(2); // Always reset to muscle selection
    setSelectedMuscle('');
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
      setWorkouts(workouts.filter(workout => workout.id !== workoutId));
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null);
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      Alert.alert('Error', 'Failed to delete workout. Please try again.');
    }
  };

  const handleUpdateWorkoutName = async () => {
    if (!editingWorkout?.id) return;
    if (!newWorkoutName.trim()) {
      setWorkoutNameError('Workout name cannot be empty');
      return;
    }

    try {
      await updateWorkoutName(editingWorkout.id, newWorkoutName);
      setWorkouts(workouts.map(workout => 
        workout.id === editingWorkout.id 
          ? { ...workout, name: newWorkoutName }
          : workout
      ));
      setEditingWorkout(null);
      setNewWorkoutName('');
      setWorkoutNameError('');
      
      // Update selected workout if it's the one being edited
      if (selectedWorkout?.id === editingWorkout.id) {
        setSelectedWorkout({
          ...selectedWorkout,
          name: newWorkoutName
        });
      }
    } catch (error) {
      console.error('Error updating workout name:', error);
      Alert.alert('Error', 'Failed to update workout name. Please try again.');
    }
  };

  const handleRemoveExercise = async (workoutId: string, exerciseIndex: number) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;

    try {
      await removeExerciseFromWorkout(workoutId, exerciseIndex, workout);
      
      // Update local state
      const updatedWorkouts = workouts.map(w => {
        if (w.id === workoutId) {
          const updatedExercises = [...w.exercises];
          updatedExercises.splice(exerciseIndex, 1);
          return { ...w, exercises: updatedExercises };
        }
        return w;
      });
      
      setWorkouts(updatedWorkouts);
      
      // Update selected workout if needed
      if (selectedWorkout?.id === workoutId) {
        const updatedExercises = [...selectedWorkout.exercises];
        updatedExercises.splice(exerciseIndex, 1);
        setSelectedWorkout({ ...selectedWorkout, exercises: updatedExercises });
      }
    } catch (error) {
      console.error('Error removing exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise. Please try again.');
    }
  };

  const getExerciseTypeStyle = (type: string) => {
    let backgroundColor, textColor;
    
    switch(type) {
      case 'cardio':
        backgroundColor = colorScheme === 'dark' ? '#1B5E20' : '#E8F5E9';
        textColor = colorScheme === 'dark' ? '#FFFFFF' : '#1B5E20';
        break;
      case 'strength':
        backgroundColor = colorScheme === 'dark' ? '#E65100' : '#FFF3E0';
        textColor = colorScheme === 'dark' ? '#FFFFFF' : '#E65100';
        break;
      case 'stretching':
        backgroundColor = colorScheme === 'dark' ? '#006064' : '#E0F7FA';
        textColor = colorScheme === 'dark' ? '#FFFFFF' : '#006064';
        break;
      default:
        backgroundColor = colorScheme === 'dark' ? '#424242' : '#F5F5F5';
        textColor = colorScheme === 'dark' ? '#FFFFFF' : '#424242';
    }
    
    return {
      backgroundColor,
      textColor
    };
  };

  const capitalizeFirstLetter = (string: string = '') => {
    return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
  };

  // Calculate animation values
  const detailsTranslateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const mainContentOpacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  // Generate day selector buttons
  const dayButtons = DAYS_OF_WEEK.map(day => ({
    value: day,
    label: day.substring(0, 3),
  }));

  const renderExerciseItem = (exercise: SavedExercise, index: number, workoutId: string) => {
    const typeStyle = getExerciseTypeStyle(exercise.type);
    
    return (
      <Card style={styles.exerciseCard} key={`${exercise.name}-${index}`}>
        <Card.Content>
          <View style={styles.exerciseHeader}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {exercise.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
                {capitalizeFirstLetter(exercise.muscle)}
              </Text>
            </View>
            <IconButton
              icon="trash-outline"
              iconColor={ERROR_COLOR}
              size={20}
              onPress={() => handleRemoveExercise(workoutId, index)}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.exerciseDetails}>
            <View style={styles.exerciseDetail}>
              <Ionicons name="repeat-outline" size={16} color={Colors[colorScheme ?? 'light'].mutedText} />
              <Text style={{ marginLeft: 4 }}>{exercise.sets || 3} sets</Text>
            </View>
            <View style={styles.exerciseDetail}>
              <Ionicons name="fitness-outline" size={16} color={Colors[colorScheme ?? 'light'].mutedText} />
              <Text style={{ marginLeft: 4 }}>{exercise.reps || 10} reps</Text>
            </View>
            <Chip 
              style={{ 
                backgroundColor: typeStyle.backgroundColor,
                height: 24 
              }}
              textStyle={{ color: typeStyle.textColor, fontSize: 12 }}
              compact
            >
              {capitalizeFirstLetter(exercise.type)}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Render workout card with swipe-to-delete functionality
  const renderWorkoutCard = (workout: Workout) => {
    return (
      <SwipeableWorkoutCard
        workout={workout}
        onDelete={handleDeleteWorkout}
        onSelect={setSelectedWorkout}
      />
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        
        <Animated.View 
          style={Platform.OS === 'web' ? 
            { 
              ...styles.mainContent,
              opacity: selectedWorkout ? mainContentOpacity : 1,
              pointerEvents: selectedWorkout ? 'none' : 'auto' 
            } : 
            [
              styles.mainContent, 
              { 
                opacity: selectedWorkout ? mainContentOpacity : 1,
                pointerEvents: selectedWorkout ? 'none' : 'auto'
              }
            ]
          }
        >
          <View style={styles.header}>
            <Text 
              variant="headlineMedium" 
              style={{ 
                color: Colors[colorScheme ?? 'light'].text, 
                fontWeight: 'bold' 
              }}
            >
              Workout Plan
            </Text>
            
            <Button 
              mode="contained" 
              onPress={showWorkoutCreationDialog}
              style={{ borderRadius: 20 }}
              icon="plus"
            >
              New Workout
            </Button>
          </View>

          <View style={styles.daySelector}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorContent}
            >
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
                  onPress={() => setSelectedDay(day)}
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
            </ScrollView>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={{ marginTop: 10, color: Colors[colorScheme ?? 'light'].text }}>
                Loading your workouts...
              </Text>
            </View>
          ) : getWorkoutsForDay(selectedDay).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="barbell-outline" 
                size={64} 
                color={Colors[colorScheme ?? 'light'].mutedText} 
              />
              <Text 
                style={{ 
                  marginTop: 16, 
                  color: Colors[colorScheme ?? 'light'].text,
                  fontSize: 18,
                  textAlign: 'center'
                }}
              >
                No workouts for {selectedDay}
              </Text>
              <Text 
                style={{ 
                  marginTop: 8, 
                  color: Colors[colorScheme ?? 'light'].mutedText,
                  textAlign: 'center',
                  paddingHorizontal: 40
                }}
              >
                Create a workout for {selectedDay} and add exercises from the exercises tab
              </Text>
              <Button 
                mode="contained" 
                onPress={showWorkoutCreationDialog}
                style={{ marginTop: 24, borderRadius: 20 }}
                icon="plus"
              >
                Create Workout
              </Button>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
              {getWorkoutsForDay(selectedDay).map((workout) => (
                renderWorkoutCard(workout))
              )}
            </ScrollView>
          )}
        </Animated.View>
        
        {selectedWorkout && (
          <Animated.View 
            style={[
              styles.workoutDetails,
              { 
                transform: [{ translateX: detailsTranslateX }],
                backgroundColor: Colors[colorScheme ?? 'light'].background
              }
            ]}
          >
            <View style={styles.detailsHeader}>
              <IconButton
                icon="arrow-back"
                size={24}
                onPress={() => setSelectedWorkout(null)}
                iconColor={Colors[colorScheme ?? 'light'].text}
                style={{ backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }}
              />
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                {selectedWorkout.name}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            
            <Divider />
            
            {selectedWorkout.exercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <Ionicons 
                  name="fitness-outline" 
                  size={64} 
                  color={Colors[colorScheme ?? 'light'].mutedText} 
                />
                <Text 
                  style={{ 
                    marginTop: 16, 
                    color: Colors[colorScheme ?? 'light'].text,
                    fontSize: 18
                  }}
                >
                  No exercises yet
                </Text>
                <Text 
                  style={{ 
                    marginTop: 8, 
                    color: Colors[colorScheme ?? 'light'].mutedText,
                    textAlign: 'center',
                    paddingHorizontal: 40
                  }}
                >
                  Add exercises from the exercises tab to build your workout
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.exercisesScrollView}>
                <Text 
                  style={[
                    styles.sectionTitle, 
                    { color: Colors[colorScheme ?? 'light'].text }
                  ]}
                >
                  Exercises
                </Text>
                
                {selectedWorkout.exercises.map((exercise, index) => 
                  renderExerciseItem(exercise, index, selectedWorkout.id!)
                )}
              </ScrollView>
            )}
            
            {/* Add exercise floating button */}
            <Button
              mode="contained"
              style={styles.addExerciseButton}
              icon="plus"
              onPress={() => {
                // Extract the focused muscle from the workout name or first exercise
                const workoutNameLower = selectedWorkout.name.toLowerCase();
                let muscleToFilter = null;
                
                // First try: Extract muscle directly from workout name
                const muscles = getMuscleGroups();
                for (const muscle of muscles) {
                  const muscleLower = muscle.toLowerCase();
                  if (workoutNameLower.includes(muscleLower)) {
                    muscleToFilter = muscle;
                    console.log(`Found muscle '${muscle}' in workout name`);
                    break;
                  }
                }
                
                // Second try: Use common workout terminology to infer muscle group
                if (!muscleToFilter) {
                  const muscleKeywords = {
                    'chest': 'chest',
                    'pec': 'chest',
                    'bench': 'chest',
                    'push': 'chest',
                    
                    'back': 'lats',
                    'pull': 'lats',
                    'lat': 'lats',
                    'row': 'lats',
                    
                    'shoulder': 'shoulders',
                    'delt': 'shoulders',
                    'press': 'shoulders',
                    'military': 'shoulders',
                    
                    'leg': 'quadriceps',
                    'quad': 'quadriceps',
                    'squat': 'quadriceps',
                    'thigh': 'quadriceps',
                    
                    'ham': 'hamstrings',
                    'glute': 'glutes',
                    
                    'arm': 'biceps',
                    'bicep': 'biceps',
                    'curl': 'biceps',
                    
                    'tri': 'triceps',
                    'extension': 'triceps',
                    'pushdown': 'triceps',
                    
                    'ab': 'abdominals',
                    'core': 'abdominals',
                    'crunch': 'abdominals',
                    'situp': 'abdominals'
                  };
                  
                  for (const [keyword, muscle] of Object.entries(muscleKeywords)) {
                    if (workoutNameLower.includes(keyword)) {
                      muscleToFilter = muscle;
                      console.log(`Inferred muscle '${muscle}' from keyword '${keyword}'`);
                      break;
                    }
                  }
                }
                
                // Third try: Get muscle from existing exercises
                if (!muscleToFilter && selectedWorkout.exercises.length > 0) {
                  // Find the most common muscle in existing exercises
                  const muscleCounts: Record<string, number> = {};
                  
                  selectedWorkout.exercises.forEach(ex => {
                    if (ex.muscle) {
                      muscleCounts[ex.muscle] = (muscleCounts[ex.muscle] || 0) + 1;
                    }
                  });
                  
                  let maxCount = 0;
                  let mostCommonMuscle = null;
                  
                  for (const [muscle, count] of Object.entries(muscleCounts)) {
                    if (count > maxCount) {
                      maxCount = count;
                      mostCommonMuscle = muscle;
                    }
                  }
                  
                  if (mostCommonMuscle) {
                    muscleToFilter = mostCommonMuscle;
                    console.log(`Using most common muscle from exercises: ${mostCommonMuscle}`);
                  }
                }
                
                // Generate a unique timestamp for the key
                const uniqueTimestamp = Date.now().toString();
                console.log(`Navigating with unique key: ${uniqueTimestamp}`);
                
                // Navigate to exercises tab with muscle filter
                router.push({
                  pathname: '/(tabs)/exercises',
                  params: {
                    workoutId: selectedWorkout.id,
                    workoutDay: selectedWorkout.day,
                    existingExercises: JSON.stringify(selectedWorkout.exercises.map(ex => ex.name)),
                    muscle: muscleToFilter || '',
                    filterByMuscle: 'true', // Force immediate filtering
                    key: uniqueTimestamp // Use timestamp to force component remount
                  }
                });
              }}
            >
              Add Exercises
            </Button>
          </Animated.View>
        )}
        
        {/* Create new workout dialog - simplified to only show muscle selection */}
        <Portal>
          <Dialog 
            visible={dialogVisible} 
            onDismiss={resetWorkoutDialog}
            style={{ backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }}
          >
            <Dialog.Title>Create Workout for {selectedDay}</Dialog.Title>
            <Dialog.Content>
              <Text style={{ marginBottom: 16 }}>
                Which muscle group would you like to focus on?
              </Text>
              <RadioButton.Group 
                onValueChange={value => setSelectedMuscle(value)} 
                value={selectedMuscle}
              >
                <ScrollView style={{ maxHeight: 300 }}>
                  {muscleGroups.map(muscle => (
                    <RadioButton.Item
                      key={muscle}
                      label={capitalizeFirstLetter(muscle)}
                      value={muscle}
                      style={{ paddingVertical: 8 }}
                    />
                  ))}
                </ScrollView>
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={resetWorkoutDialog}>Cancel</Button>
              <Button 
                mode="contained"
                onPress={handleCreateWorkout}
                disabled={!selectedMuscle}
              >
                Create & Find Exercises
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        
        {/* Edit workout name dialog */}
        <Portal>
          <Dialog 
            visible={!!editingWorkout && !menuVisible} 
            onDismiss={() => setEditingWorkout(null)}
            style={{ backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }}
          >
            <Dialog.Title>Rename Workout</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Workout Name"
                value={newWorkoutName}
                onChangeText={setNewWorkoutName}
                error={!!workoutNameError}
                style={{ marginTop: 10 }}
              />
              {workoutNameError ? (
                <Text style={{ color: 'red', marginTop: 5 }}>{workoutNameError}</Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditingWorkout(null)}>Cancel</Button>
              <Button onPress={handleUpdateWorkoutName}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 10,
  },
  daySelector: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  daySelectorContent: {
    paddingHorizontal: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingTop: 0,
  },
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
  workoutDetails: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 100,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  exercisesScrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  divider: {
    marginVertical: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  exerciseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyExercises: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 16,
    backgroundColor: ERROR_COLOR,
    borderRadius: 12,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addExerciseButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 20,
  },
}); 