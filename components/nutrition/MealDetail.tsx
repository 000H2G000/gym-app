import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { Text, Card, Divider, Button, IconButton, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Meal, calculateNutrition } from '../../services/mealService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import Slider from '@react-native-community/slider';

interface MealDetailProps {
  meal: Meal;
  onAdd: (meal: Meal, grams: number) => void;
  onClose: () => void;
}

const MealDetail: React.FC<MealDetailProps> = ({ meal, onAdd, onClose }) => {
  const [portionSize, setPortionSize] = useState(meal.servingSizeGrams);
  const [nutrition, setNutrition] = useState(calculateNutrition(meal, meal.servingSizeGrams));
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    setNutrition(calculateNutrition(meal, portionSize));
  }, [portionSize, meal]);
  
  const handleSliderChange = (value: number) => {
    setPortionSize(Math.round(value));
  };

  const adjustPortionSize = (adjustment: number) => {
    const newSize = Math.max(10, portionSize + adjustment);
    setPortionSize(newSize);
  };
  
  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={onClose} 
          style={styles.backButton}
          iconColor={Colors[colorScheme ?? 'light'].text}
        />
      </View>
      
      <Image source={{ uri: meal.image }} style={styles.mealImage} />
      
      <View style={styles.content}>
        <Text style={[styles.mealName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {meal.name}
        </Text>
        
        <Card 
          style={[
            styles.nutritionCard, 
            { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
          ]}
        >
          <Card.Content>
            <Text style={styles.sectionTitle}>Nutrition Information</Text>
            <Text style={styles.portionText}>
              Portion size: {portionSize}g
            </Text>
            
            <View style={styles.sliderContainer}>
              <IconButton 
                icon="minus" 
                size={20}
                onPress={() => adjustPortionSize(-25)} 
                style={styles.sliderButton}
              />
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={500}
                value={portionSize}
                onValueChange={(value) => handleSliderChange(value)}
                minimumTrackTintColor={Colors[colorScheme ?? 'light'].tint}
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor={Colors[colorScheme ?? 'light'].tint}
              />
              <IconButton 
                icon="plus" 
                size={20}
                onPress={() => adjustPortionSize(25)} 
                style={styles.sliderButton}
              />
            </View>
            
            <View style={styles.nutrientRows}>
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientName}>Calories</Text>
                <Text style={styles.nutrientValue}>{nutrition.calories} kcal</Text>
              </View>
              
              <View style={styles.nutrientBar}>
                <Text style={styles.barLabel}>Protein</Text>
                <View style={styles.barContainer}>
                  <ProgressBar 
                    progress={nutrition.protein / 50} 
                    color="#4CAF50" 
                    style={styles.bar} 
                  />
                  <Text style={styles.barValue}>{nutrition.protein}g</Text>
                </View>
              </View>
              
              <View style={styles.nutrientBar}>
                <Text style={styles.barLabel}>Carbs</Text>
                <View style={styles.barContainer}>
                  <ProgressBar 
                    progress={nutrition.carbs / 150} 
                    color="#2196F3" 
                    style={styles.bar} 
                  />
                  <Text style={styles.barValue}>{nutrition.carbs}g</Text>
                </View>
              </View>
              
              <View style={styles.nutrientBar}>
                <Text style={styles.barLabel}>Fat</Text>
                <View style={styles.barContainer}>
                  <ProgressBar 
                    progress={nutrition.fat / 50} 
                    color="#FF9800" 
                    style={styles.bar} 
                  />
                  <Text style={styles.barValue}>{nutrition.fat}g</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card 
          style={[
            styles.card, 
            { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
          ]}
        >
          <Card.Content>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {meal.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.ingredientText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {ingredient}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
        
        <Card 
          style={[
            styles.card, 
            { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
          ]}
        >
          <Card.Content>
            <Text style={styles.sectionTitle}>Recipe</Text>
            {meal.recipe.map((step, index) => (
              <View key={index} style={styles.recipeStep}>
                <View style={[styles.stepNumber, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {step}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={() => onAdd(meal, portionSize)}
          style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          contentStyle={styles.addButtonContent}
        >
          Add to Daily Log
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    padding: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
  },
  mealImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  nutritionCard: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  portionText: {
    fontSize: 16,
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderButton: {
    margin: 0,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  nutrientRows: {
    marginTop: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutrientName: {
    fontSize: 16,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  nutrientBar: {
    marginBottom: 12,
  },
  barLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  barValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    width: 36,
    textAlign: 'right',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientText: {
    marginLeft: 8,
    fontSize: 15,
  },
  recipeStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    marginVertical: 8,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
});

export default MealDetail;