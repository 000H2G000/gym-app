import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Chip, Divider, Button, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Meal, UserMeal, calculateNutrition, deleteCustomMeal } from '../../services/mealService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext } from '../../app/_layout';

interface MealDetailProps {
  meal: Meal | UserMeal;
  onClose: () => void;
  onSelectMeal?: () => void;
  onMealDeleted?: () => void;
}

const MealDetail: React.FC<MealDetailProps> = ({ meal, onClose, onSelectMeal, onMealDeleted }) => {
  const [servingSize, setServingSize] = useState(meal.servingSizeGrams);
  const [servings, setServings] = useState(meal.defaultServings);
  const colorScheme = useColorScheme();
  const { user } = useContext(AuthContext);
  
  // Calculate if this is a custom meal owned by the current user
  const isCustomMeal = 'isCustom' in meal && meal.isCustom;
  const isOwnedByUser = isCustomMeal && user && 'userId' in meal && meal.userId === user.uid;
  
  // Calculate nutrition based on serving size
  const totalGrams = servings * servingSize;
  const nutrition = calculateNutrition(meal, totalGrams);
  
  const handleServingSizeChange = (amount: number) => {
    const newSize = Math.max(25, servingSize + amount); // Minimum 25g
    setServingSize(newSize);
  };
  
  const handleServingsChange = (amount: number) => {
    const newServings = Math.max(0.5, servings + amount); // Minimum 0.5 servings
    setServings(newServings);
  };
  
  const handleDeleteMeal = () => {
    if (!isOwnedByUser) return;
    
    Alert.alert(
      "Delete Meal",
      "Are you sure you want to delete this custom meal? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomMeal(meal.id);
              Alert.alert("Success", "Your meal has been deleted.");
              if (onMealDeleted) {
                onMealDeleted();
              }
              onClose();
            } catch (error) {
              console.error("Error deleting meal:", error);
              Alert.alert("Error", "Failed to delete meal. Please try again.");
            }
          }
        }
      ]
    );
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={onClose}
          style={styles.closeButton}
        />
        
        {isOwnedByUser && (
          <View style={styles.actionButtons}>
            <IconButton
              icon="trash-outline"
              iconColor="#FF3B30"
              size={24}
              onPress={handleDeleteMeal}
            />
          </View>
        )}
      </View>
      
      {/* Meal Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.image }} style={styles.mealImage} />
      </View>
      
      {/* Meal Info */}
      <View style={styles.contentPadding}>
        <View style={styles.mealHeaderRow}>
          <Text style={[styles.mealName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {meal.name}
          </Text>
          <Chip 
            style={[
              styles.categoryChip, 
              { backgroundColor: Colors[colorScheme ?? 'light'].tint }
            ]}
          >
            <Text style={styles.categoryText}>{meal.category}</Text>
          </Chip>
        </View>
        
        {isCustomMeal && (
          <Chip style={styles.customMealChip}>
            <Text style={{ color: 'white' }}>My Custom Meal</Text>
          </Chip>
        )}
        
        {/* Nutritional Info */}
        <View style={[styles.nutritionCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Nutritional Information
          </Text>
          
          {/* Serving Size Controls */}
          <View style={styles.servingControls}>
            <View style={styles.servingControl}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Serving Size:</Text>
              <View style={styles.controlRow}>
                <IconButton 
                  icon="remove"
                  size={16}
                  onPress={() => handleServingSizeChange(-25)}
                  style={styles.controlButton}
                />
                <Text style={[styles.servingValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {servingSize}g
                </Text>
                <IconButton 
                  icon="add"
                  size={16}
                  onPress={() => handleServingSizeChange(25)}
                  style={styles.controlButton}
                />
              </View>
            </View>
            
            <View style={styles.servingControl}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Servings:</Text>
              <View style={styles.controlRow}>
                <IconButton 
                  icon="remove"
                  size={16}
                  onPress={() => handleServingsChange(-0.5)}
                  style={styles.controlButton}
                />
                <Text style={[styles.servingValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {servings.toFixed(1)}
                </Text>
                <IconButton 
                  icon="add"
                  size={16}
                  onPress={() => handleServingsChange(0.5)}
                  style={styles.controlButton}
                />
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Nutrition Stats */}
          <View style={styles.nutritionStats}>
            <View style={styles.nutritionStat}>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {nutrition.calories} kcal
              </Text>
            </View>
            
            <View style={styles.nutritionStat}>
              <Text style={styles.statLabel}>Protein</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {nutrition.protein}g
              </Text>
            </View>
            
            <View style={styles.nutritionStat}>
              <Text style={styles.statLabel}>Carbs</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {nutrition.carbs}g
              </Text>
            </View>
            
            <View style={styles.nutritionStat}>
              <Text style={styles.statLabel}>Fat</Text>
              <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                {nutrition.fat}g
              </Text>
            </View>
          </View>
          
          <View style={styles.totalGrams}>
            <Text style={[styles.totalGramsText, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
              Total: {totalGrams}g
            </Text>
          </View>
        </View>
        
        {/* Ingredients */}
        <View style={[styles.sectionCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Ingredients
          </Text>
          {meal.ingredients.map((ingredient, index) => (
            <View key={`ingredient-${index}`} style={styles.listItem}>
              <Ionicons name="ellipse" size={8} color={Colors[colorScheme ?? 'light'].tint} style={styles.listBullet} />
              <Text style={[styles.listText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {ingredient}
              </Text>
            </View>
          ))}
        </View>
        
        {/* Recipe */}
        <View style={[styles.sectionCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Recipe
          </Text>
          {meal.recipe.map((step, index) => (
            <View key={`step-${index}`} style={styles.listItem}>
              <Text style={[styles.stepNumber, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                {index + 1}
              </Text>
              <Text style={[styles.listText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
        
        {onSelectMeal && (
          <Button 
            mode="contained"
            style={[styles.selectButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={onSelectMeal}
            contentStyle={styles.selectButtonContent}
          >
            Add to My Meals
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    margin: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  imageContainer: {
    height: 250,
    width: '100%',
    marginBottom: 16,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  categoryChip: {
    borderRadius: 16,
  },
  categoryText: {
    color: 'white',
    textTransform: 'capitalize',
  },
  customMealChip: {
    marginBottom: 12,
    backgroundColor: '#FF6B6B',
  },
  nutritionCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  servingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  servingControl: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  controlButton: {
    margin: 0,
  },
  servingValue: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalGrams: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  totalGramsText: {
    fontSize: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  listBullet: {
    marginTop: 6,
    marginRight: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 24,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    lineHeight: 20,
  },
  selectButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  selectButtonContent: {
    height: 50,
  },
});

export default MealDetail;