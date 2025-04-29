import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, ProgressBar, useTheme, Button } from 'react-native-paper';
import FoodRecognition from '../../components/FoodRecognition';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodItems: string[];
}

const NutritionScreen = () => {
  const theme = useTheme();
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [dailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  });

  const handleNutritionData = (data: NutritionData) => {
    if (!data || !data.foodItems || data.foodItems.length === 0) {
      Alert.alert('Error', 'No food items were detected in the image. Please try again.');
      return;
    }
    setNutritionData(data);
  };

  const handleError = (error: string) => {
    Alert.alert('Error', error);
  };

  const calculatePercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 80) return theme.colors.warning;
    return theme.colors.primary;
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Food Recognition</Title>
          <Paragraph style={styles.subtitle}>
            Take a picture of your meal or choose from gallery to analyze its nutritional content
          </Paragraph>
          <FoodRecognition 
            onNutritionData={handleNutritionData}
            onError={handleError}
          />
        </Card.Content>
      </Card>

      {nutritionData && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Nutrition Analysis</Title>
            
            <View style={styles.nutrientContainer}>
              <Text style={styles.nutrientLabel}>Calories</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={calculatePercentage(nutritionData.calories, dailyGoals.calories) / 100}
                  color={getProgressColor(calculatePercentage(nutritionData.calories, dailyGoals.calories))}
                  style={styles.progressBar}
                />
                <Text style={styles.nutrientValue}>
                  {nutritionData.calories} / {dailyGoals.calories} kcal
              </Text>
              </View>
            </View>

            <View style={styles.nutrientContainer}>
              <Text style={styles.nutrientLabel}>Protein</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={calculatePercentage(nutritionData.protein, dailyGoals.protein) / 100}
                  color={getProgressColor(calculatePercentage(nutritionData.protein, dailyGoals.protein))}
                  style={styles.progressBar}
                />
                <Text style={styles.nutrientValue}>
                  {nutritionData.protein}g / {dailyGoals.protein}g
                </Text>
              </View>
            </View>

            <View style={styles.nutrientContainer}>
              <Text style={styles.nutrientLabel}>Carbohydrates</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={calculatePercentage(nutritionData.carbs, dailyGoals.carbs) / 100}
                  color={getProgressColor(calculatePercentage(nutritionData.carbs, dailyGoals.carbs))}
                  style={styles.progressBar}
                />
                <Text style={styles.nutrientValue}>
                  {nutritionData.carbs}g / {dailyGoals.carbs}g
                </Text>
              </View>
        </View>

            <View style={styles.nutrientContainer}>
              <Text style={styles.nutrientLabel}>Fat</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={calculatePercentage(nutritionData.fat, dailyGoals.fat) / 100}
                  color={getProgressColor(calculatePercentage(nutritionData.fat, dailyGoals.fat))}
                  style={styles.progressBar}
                />
                <Text style={styles.nutrientValue}>
                  {nutritionData.fat}g / {dailyGoals.fat}g
                  </Text>
              </View>
            </View>

            <View style={styles.foodItemsContainer}>
              <Text style={styles.foodItemsTitle}>Detected Food Items:</Text>
              {nutritionData.foodItems.map((item, index) => (
                <Text key={index} style={styles.foodItem}>
                  • {item}
                </Text>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => setNutritionData(null)}
              style={styles.resetButton}
            >
              Analyze Another Meal
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
    color: '#666',
  },
  nutrientContainer: {
    marginBottom: 16,
  },
  nutrientLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  nutrientValue: {
    marginLeft: 8,
    minWidth: 100,
    textAlign: 'right',
  },
  foodItemsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  foodItemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  foodItem: {
    marginLeft: 8,
    marginBottom: 4,
  },
  resetButton: {
    marginTop: 16,
  },
}); 

export default NutritionScreen; 