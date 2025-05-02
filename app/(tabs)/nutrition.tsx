import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, ProgressBar, Button, FAB, Portal, Modal, Divider, IconButton } from 'react-native-paper';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MealSelector from '../../components/nutrition/MealSelector';
import MealDetail from '../../components/nutrition/MealDetail';
import { Meal } from '../../services/mealService';

interface ConsumedMeal {
  meal: Meal;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const NutritionScreen = () => {
  const colorScheme = useColorScheme();
  
  // State for daily consumption tracking
  const [consumedMeals, setConsumedMeals] = useState<ConsumedMeal[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  
  // Daily goals
  const [dailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  });
  
  // UI state
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  
  // Calculate percentage of goal reached
  const calculatePercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  // Get color based on percentage of goal
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "#FF5252"; // Red if over goal
    if (percentage >= 80) return "#FF9800"; // Orange if getting close
    return Colors[colorScheme ?? 'light'].tint; // Default theme color
  };
  
  // Add a meal to the daily consumption
  const handleAddMeal = (meal: Meal, grams: number) => {
    // Calculate nutrition for the specified portion
    const factor = grams / 100;
    const calories = Math.round(meal.caloriesPer100g * factor);
    const protein = parseFloat((meal.proteinPer100g * factor).toFixed(1));
    const carbs = parseFloat((meal.carbsPer100g * factor).toFixed(1));
    const fat = parseFloat((meal.fatPer100g * factor).toFixed(1));
    
    // Create consumed meal object
    const consumedMeal: ConsumedMeal = {
      meal,
      grams,
      calories,
      protein,
      carbs,
      fat
    };
    
    // Add to consumed meals list
    setConsumedMeals([...consumedMeals, consumedMeal]);
    
    // Update daily totals
    setDailyTotals({
      calories: dailyTotals.calories + calories,
      protein: parseFloat((dailyTotals.protein + protein).toFixed(1)),
      carbs: parseFloat((dailyTotals.carbs + carbs).toFixed(1)),
      fat: parseFloat((dailyTotals.fat + fat).toFixed(1))
    });
    
    // Close meal detail
    setSelectedMeal(null);
    
    // Show success message
    Alert.alert('Meal Added', `Added ${meal.name} (${grams}g) to your daily log.`);
  };
  
  // Remove a meal from the daily consumption
  const handleRemoveMeal = (index: number) => {
    // Get the meal to remove
    const mealToRemove = consumedMeals[index];
    
    // Update daily totals
    setDailyTotals({
      calories: dailyTotals.calories - mealToRemove.calories,
      protein: parseFloat((dailyTotals.protein - mealToRemove.protein).toFixed(1)),
      carbs: parseFloat((dailyTotals.carbs - mealToRemove.carbs).toFixed(1)),
      fat: parseFloat((dailyTotals.fat - mealToRemove.fat).toFixed(1))
    });
    
    // Remove from consumed meals list
    const updatedMeals = [...consumedMeals];
    updatedMeals.splice(index, 1);
    setConsumedMeals(updatedMeals);
  };
  
  // Reset daily consumption
  const resetDailyLog = () => {
    Alert.alert(
      'Reset Daily Log',
      'Are you sure you want to clear all logged meals for today?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          onPress: () => {
            setConsumedMeals([]);
            setDailyTotals({
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0
            });
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={styles.scrollView}>
        {/* Daily Nutrition Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Daily Nutrition</Title>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Ionicons name="flame-outline" size={24} color="#FF5252" />
                <Text style={styles.summaryValue}>{dailyTotals.calories}</Text>
                <Text style={styles.summaryLabel}>Calories</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="barbell-outline" size={24} color="#4CAF50" />
                <Text style={styles.summaryValue}>{dailyTotals.protein}g</Text>
                <Text style={styles.summaryLabel}>Protein</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="pizza-outline" size={24} color="#2196F3" />
                <Text style={styles.summaryValue}>{dailyTotals.carbs}g</Text>
                <Text style={styles.summaryLabel}>Carbs</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="water-outline" size={24} color="#FF9800" />
                <Text style={styles.summaryValue}>{dailyTotals.fat}g</Text>
                <Text style={styles.summaryLabel}>Fat</Text>
              </View>
            </View>
            
            <View style={styles.nutrientContainer}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientLabel}>Calories</Text>
                <Text style={styles.goalLabel}>
                  {dailyTotals.calories} / {dailyGoals.calories} kcal
                </Text>
              </View>
              <ProgressBar
                progress={calculatePercentage(dailyTotals.calories, dailyGoals.calories) / 100}
                color={getProgressColor(calculatePercentage(dailyTotals.calories, dailyGoals.calories))}
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.nutrientContainer}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientLabel}>Protein</Text>
                <Text style={styles.goalLabel}>
                  {dailyTotals.protein}g / {dailyGoals.protein}g
                </Text>
              </View>
              <ProgressBar
                progress={calculatePercentage(dailyTotals.protein, dailyGoals.protein) / 100}
                color={getProgressColor(calculatePercentage(dailyTotals.protein, dailyGoals.protein))}
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.nutrientContainer}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientLabel}>Carbohydrates</Text>
                <Text style={styles.goalLabel}>
                  {dailyTotals.carbs}g / {dailyGoals.carbs}g
                </Text>
              </View>
              <ProgressBar
                progress={calculatePercentage(dailyTotals.carbs, dailyGoals.carbs) / 100}
                color={getProgressColor(calculatePercentage(dailyTotals.carbs, dailyGoals.carbs))}
                style={styles.progressBar}
              />
            </View>
            
            <View style={styles.nutrientContainer}>
              <View style={styles.nutrientLabelContainer}>
                <Text style={styles.nutrientLabel}>Fat</Text>
                <Text style={styles.goalLabel}>
                  {dailyTotals.fat}g / {dailyGoals.fat}g
                </Text>
              </View>
              <ProgressBar
                progress={calculatePercentage(dailyTotals.fat, dailyGoals.fat) / 100}
                color={getProgressColor(calculatePercentage(dailyTotals.fat, dailyGoals.fat))}
                style={styles.progressBar}
              />
            </View>
            
            {consumedMeals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="restaurant-outline" 
                  size={50} 
                  color={Colors[colorScheme ?? 'light'].mutedText} 
                />
                <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                  No meals logged today
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => setSelectorVisible(true)}
                  style={[styles.addMealButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                >
                  Add Meal
                </Button>
              </View>
            ) : (
              <Button 
                mode="outlined" 
                onPress={resetDailyLog}
                style={styles.resetButton}
              >
                Reset Daily Log
              </Button>
            )}
          </Card.Content>
        </Card>
        
        {/* Consumed Meals List */}
        {consumedMeals.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Today's Meals</Title>
              
              {consumedMeals.map((consumedMeal, index) => (
                <React.Fragment key={`${consumedMeal.meal.id}-${index}`}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <View style={styles.mealRow}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{consumedMeal.meal.name}</Text>
                      <Text style={styles.mealDetail}>
                        {consumedMeal.grams}g • {consumedMeal.calories} kcal
                      </Text>
                      <Text style={styles.mealMacros}>
                        P: {consumedMeal.protein}g • C: {consumedMeal.carbs}g • F: {consumedMeal.fat}g
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => handleRemoveMeal(index)}
                    />
                  </View>
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      
      {/* Add Meal FAB */}
      <FAB
        icon="plus"
        label="Add Meal"
        style={[styles.fab, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
        onPress={() => setSelectorVisible(true)}
      />
      
      {/* Meal Selector Modal */}
      <Portal>
        <Modal
          visible={selectorVisible}
          onDismiss={() => setSelectorVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Select a Meal
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setSelectorVisible(false)}
            />
          </View>
          
          <MealSelector onSelectMeal={(meal) => {
            setSelectedMeal(meal);
            setSelectorVisible(false);
          }} />
        </Modal>
      </Portal>
      
      {/* Meal Detail Modal */}
      <Portal>
        <Modal
          visible={selectedMeal !== null}
          onDismiss={() => setSelectedMeal(null)}
          contentContainerStyle={[
            styles.modalContainer,
            styles.detailModalContainer,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}
        >
          {selectedMeal && (
            <MealDetail
              meal={selectedMeal}
              onAdd={handleAddMeal}
              onClose={() => setSelectedMeal(null)}
            />
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
    padding: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  nutrientContainer: {
    marginBottom: 16,
  },
  nutrientLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginVertical: 12,
    fontSize: 16,
  },
  addMealButton: {
    marginTop: 16,
    paddingVertical: 4,
  },
  resetButton: {
    marginTop: 16,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
  },
  mealDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mealMacros: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 16,
    borderRadius: 12,
    flex: 1,
    paddingBottom: 16,
  },
  detailModalContainer: {
    margin: 0,
    padding: 0,
    borderRadius: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  }
});

export default NutritionScreen;