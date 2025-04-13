import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { Exercise } from './exercisesService';

export interface Workout {
  id?: string;
  name: string;
  exercises: SavedExercise[];
  userId: string;
  day?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SavedExercise extends Exercise {
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  addedAt?: any;
}

// Local cache for workouts to improve performance and enable immediate UI updates
let workoutsCache: Workout[] = [];

// Helper function to update cache with a new/updated workout
export const updateWorkoutInLocalCache = (updatedWorkout: Workout): void => {
  // Find if the workout already exists in cache
  const existingIndex = workoutsCache.findIndex(w => w.id === updatedWorkout.id);
  
  if (existingIndex >= 0) {
    // Replace the existing workout
    workoutsCache[existingIndex] = updatedWorkout;
  } else {
    // Add the new workout to cache
    workoutsCache.push(updatedWorkout);
  }
};

// Modify getUserWorkouts to use and update the cache
export const getUserWorkouts = async (userId: string): Promise<Workout[]> => {
  try {
    const q = query(collection(db, 'workouts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const workouts: Workout[] = [];
    querySnapshot.forEach((doc) => {
      workouts.push({ id: doc.id, ...doc.data() } as Workout);
    });
    
    // Update the cache
    workoutsCache = workouts;
    
    return workouts;
  } catch (error) {
    console.error('Error getting workouts', error);
    throw error;
  }
};

// Add this function to get workouts from cache if available
export const getCachedWorkouts = (): Workout[] => {
  return workoutsCache;
};

// Create a new workout
export const createWorkout = async (userId: string, name: string, day: string = 'Monday'): Promise<Workout> => {
  try {
    const workoutData: Workout = {
      name,
      exercises: [],
      userId,
      day,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'workouts'), workoutData);
    return { ...workoutData, id: docRef.id };
  } catch (error) {
    console.error('Error creating workout', error);
    throw error;
  }
};

// Delete a workout
export const deleteWorkout = async (workoutId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'workouts', workoutId));
  } catch (error) {
    console.error('Error deleting workout', error);
    throw error;
  }
};

// Add exercise to workout
export const addExerciseToWorkout = async (
  workoutId: string,
  exercise: Exercise,
  sets: number = 3,
  reps: number = 10
): Promise<void> => {
  try {
    const savedExercise: SavedExercise = {
      ...exercise,
      sets,
      reps,
      addedAt: new Date().toISOString()
    };
    
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, {
      exercises: arrayUnion(savedExercise),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding exercise to workout', error);
    throw error;
  }
};

// Remove exercise from workout
export const removeExerciseFromWorkout = async (
  workoutId: string,
  exerciseIndex: number,
  workoutData: Workout
): Promise<void> => {
  try {
    // Create a new array without the exercise at the specified index
    const updatedExercises = [...workoutData.exercises];
    updatedExercises.splice(exerciseIndex, 1);
    
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, {
      exercises: updatedExercises,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing exercise from workout', error);
    throw error;
  }
};

// Update exercise in workout
export const updateExerciseInWorkout = async (
  workoutId: string,
  exerciseIndex: number,
  updatedExercise: SavedExercise,
  workoutData: Workout
): Promise<void> => {
  try {
    // Create a new array with the updated exercise
    const updatedExercises = [...workoutData.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;
    
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, {
      exercises: updatedExercises,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating exercise in workout', error);
    throw error;
  }
};

// Update workout name
export const updateWorkoutName = async (
  workoutId: string,
  name: string
): Promise<void> => {
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, {
      name,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating workout name', error);
    throw error;
  }
};

// Update workout day
export const updateWorkoutDay = async (
  workoutId: string,
  day: string
): Promise<void> => {
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, {
      day,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating workout day', error);
    throw error;
  }
}; 