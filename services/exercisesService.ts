import axios from 'axios';

const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const BASE_URL = 'https://api.api-ninjas.com/v1/exercises';

export interface Exercise {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

export const getExercises = async (params: {
  name?: string;
  type?: string;
  muscle?: string;
  difficulty?: string;
}): Promise<Exercise[]> => {
  try {
    const response = await axios.get(BASE_URL, {
      params,
      headers: {
        'X-Api-Key': API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
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