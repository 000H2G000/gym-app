import axios from 'axios';

// You need to sign up for API Ninjas and get your API key at https://api-ninjas.com
// Then replace 'YOUR_API_KEY' with your actual API key
const API_KEY = 'tgg6P+bpOUdBA8WzS/4SQA==ruefRXrFpBpsGxAM';
const BASE_URL = 'https://api.api-ninjas.com/v1/exercises';

export interface Exercise {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

// Mock exercises for when API key is not available
const getMockExercises = (): Exercise[] => {
  return [
    {
      name: 'Incline Hammer Curls',
      type: 'strength',
      muscle: 'biceps',
      equipment: 'dumbbell',
      difficulty: 'beginner',
      instructions: 'Seat yourself on an incline bench with a dumbbell in each hand. You should pressed firmly against he back with your feet together. Allow the dumbbells to hang straight down at your side, holding them with a neutral grip. This will be your starting position. Initiate the movement by flexing at the elbow, attempting to keep the upper arm stationary. Continue to the top of the movement and pause, then slowly return to the start position.'
    },
    {
      name: 'Barbell Bench Press',
      type: 'strength',
      muscle: 'chest',
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: 'Lie on a bench, lower the barbell to your chest, then push it back up.'
    },
    {
      name: 'Squat',
      type: 'strength',
      muscle: 'quadriceps',
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: 'Stand with the barbell on your shoulders, bend your knees until your thighs are parallel to the ground, then stand back up.'
    },
    {
      name: 'Deadlift',
      type: 'strength',
      muscle: 'lower_back',
      equipment: 'barbell',
      difficulty: 'intermediate',
      instructions: 'Bend down and grab the barbell, then stand up straight while holding it.'
    },
    {
      name: 'Pull-up',
      type: 'strength',
      muscle: 'lats',
      equipment: 'body_only',
      difficulty: 'intermediate',
      instructions: 'Hang from a bar and pull yourself up until your chin is over the bar.'
    }
  ];
};

export const getExercises = async (params: {
  name?: string;
  type?: string;
  muscle?: string;
  difficulty?: string;
}): Promise<Exercise[]> => {
  try {
    // Check if API key is set
    if (API_KEY === 'YOUR_API_KEY') {
      console.warn('API Ninja key not set. Using mock data instead. Add your API key in services/exercisesService.ts');
      
      // Filter mock data based on params
      let filteredData = getMockExercises();
      
      if (params.name) {
        filteredData = filteredData.filter(exercise => 
          exercise.name.toLowerCase().includes(params.name!.toLowerCase())
        );
      }
      
      if (params.type) {
        filteredData = filteredData.filter(exercise => 
          exercise.type === params.type
        );
      }
      
      if (params.muscle) {
        filteredData = filteredData.filter(exercise => 
          exercise.muscle === params.muscle
        );
      }
      
      if (params.difficulty) {
        filteredData = filteredData.filter(exercise => 
          exercise.difficulty === params.difficulty
        );
      }
      
      return filteredData;
    }

    const response = await axios.get(BASE_URL, {
      params,
      headers: {
        'X-Api-Key': API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return getMockExercises();
  }
};

export const getExerciseTypes = () => {
  return [
    'cardio',
    'olympic_weightlifting',
    'plyometrics',
    'powerlifting',
    'strength',
    'stretching',
    'strongman',
  ];
};

export const getMuscleGroups = () => {
  return [
    'abdominals',
    'abductors',
    'adductors',
    'biceps',
    'calves',
    'chest',
    'forearms',
    'glutes',
    'hamstrings',
    'lats',
    'lower_back',
    'middle_back',
    'neck',
    'quadriceps',
    'traps',
    'triceps',
  ];
};

export const getDifficultyLevels = () => {
  return ['beginner', 'intermediate', 'expert'];
}; 