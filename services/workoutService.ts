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
export const getUserWorkouts = async (userId: string, includeAllUsers: boolean = false): Promise<Workout[]> => {
  try {
    // If includeAllUsers is true, query all workouts, otherwise just the user's workouts
    const q = includeAllUsers 
      ? query(collection(db, 'workouts')) 
      : query(collection(db, 'workouts'), where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    const workouts: Workout[] = [];
    querySnapshot.forEach((doc) => {
      workouts.push({ id: doc.id, ...doc.data() } as Workout);
    });
    
    // Only update the cache if we're fetching the user's workouts
    if (!includeAllUsers) {
      workoutsCache = workouts;
    }
    
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

// Find potential gym partners with same workout on the same day
export interface GymPartner {
  userId: string;
  fullName: string;
  photoURL?: string;
  workoutId: string;
  workoutName: string;
  day: string;
}

export const findGymPartners = async (workout: Workout, currentUserId: string): Promise<GymPartner[]> => {
  try {
    // Get the day of the workout
    const day = workout.day || 'Monday';
    
    // Find workouts on the same day from different users
    const workoutsQuery = query(
      collection(db, 'workouts'), 
      where('day', '==', day),
      where('userId', '!=', currentUserId)
    );
    
    const workoutsSnapshot = await getDocs(workoutsQuery);
    
    if (workoutsSnapshot.empty) {
      return [];
    }
    
    const partners: GymPartner[] = [];
    
    // Extract muscle groups from the current workout's exercises
    const workoutMuscles = new Set(
      workout.exercises
        .map(ex => ex.muscle?.toLowerCase())
        .filter(muscle => muscle) // Filter out undefined/empty
    );
    
    // For each matching workout, check muscle group overlap
    for (const workoutDoc of workoutsSnapshot.docs) {
      const partnerWorkout = { id: workoutDoc.id, ...workoutDoc.data() } as Workout;
      
      // Skip workouts with no exercises
      if (!partnerWorkout.exercises || partnerWorkout.exercises.length === 0) {
        continue;
      }
      
      // Extract muscle groups from partner workout
      const partnerMuscles = new Set(
        partnerWorkout.exercises
          .map(ex => ex.muscle?.toLowerCase())
          .filter(muscle => muscle) // Filter out undefined/empty
      );
      
      // Skip if no muscle groups overlap
      let hasOverlap = false;
      
      // Check for muscle group overlap
      if (workoutMuscles.size > 0 && partnerMuscles.size > 0) {
        for (const muscle of workoutMuscles) {
          if (partnerMuscles.has(muscle)) {
            hasOverlap = true;
            break;
          }
        }
      }
      
      // If workout name contains similar words, consider it a match too
      const workoutWords = workout.name.toLowerCase().split(/[\s-_]+/);
      const partnerWords = partnerWorkout.name.toLowerCase().split(/[\s-_]+/);
      
      for (const word of workoutWords) {
        if (word.length > 3 && partnerWords.includes(word)) { // Check for meaningful words (length > 3)
          hasOverlap = true;
          break;
        }
      }
      
      if (hasOverlap) {
        // Get user info for this workout
        const userDoc = await getDoc(doc(db, 'users', partnerWorkout.userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          partners.push({
            userId: partnerWorkout.userId,
            fullName: userData.fullName || 'Anonymous User',
            photoURL: userData.photoURL,
            workoutId: partnerWorkout.id || '',
            workoutName: partnerWorkout.name,
            day: partnerWorkout.day || 'Unknown',
          });
        }
      }
    }
    
    return partners;
  } catch (error) {
    console.error('Error finding gym partners:', error);
    throw error;
  }
}; 