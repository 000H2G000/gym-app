import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Modal, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Text, FAB, Button, Chip, Divider, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MealSelector from '@/components/nutrition/MealSelector';
import MealDetail from '@/components/nutrition/MealDetail';
import AddMealForm from '@/components/nutrition/AddMealForm';
import { Meal, getMealsByCategory, getAllMeals, getUserCustomMeals } from '@/services/mealService';
import { AuthContext } from '../_layout';

export default function NutritionScreen() {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [userMeals, setUserMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'custom'>('all');
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  
  const colorScheme = useColorScheme();
  const { user } = useContext(AuthContext);
  
  // Load meals when the screen is focused
  const loadMeals = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const customMeals = await getUserCustomMeals(user.uid);
        setUserMeals(customMeals);
        
        const all = await getAllMeals(user.uid);
        setAllMeals(all);
      } else {
        const all = await getAllMeals();
        setAllMeals(all);
        setUserMeals([]);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    loadMeals();
  }, [loadMeals]);
  
  const handleCloseMealDetail = () => {
    setIsDetailVisible(false);
    setSelectedMeal(null);
  };
  
  const handleMealSelected = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsDetailVisible(true);
    setIsSelectorVisible(false);
  };
  
  const handleAddMeal = () => {
    if (!user) {
      // Show login prompt if user is not logged in
      alert('Please log in to add custom meals');
      return;
    }
    
    // Show action menu
    setIsSelectorVisible(true);
  };
  
  const handleCloseMealSelector = () => {
    setIsSelectorVisible(false);
  };
  
  const handleShowAddForm = () => {
    setIsSelectorVisible(false);
    setIsAddFormVisible(true);
  };
  
  const handleMealAdded = () => {
    setIsAddFormVisible(false);
    // Reload meals to show the newly added custom meal
    loadMeals();
  };
  
  const handleCancelAddMeal = () => {
    setIsAddFormVisible(false);
  };
  
  const displayedMeals = activeTab === 'custom' ? userMeals : allMeals;
  
  const mealsByCategory = React.useMemo(() => {
    const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
    let categorized: Record<string, Meal[]> = {};
    
    categories.forEach(category => {
      categorized[category] = displayedMeals.filter(meal => meal.category === category);
    });
    
    return categorized;
  }, [displayedMeals]);

  if (isLoading && !displayedMeals.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Stack.Screen options={{ title: 'Nutrition', headerLargeTitle: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 16, color: Colors[colorScheme ?? 'light'].text }}>
            Loading meals...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen options={{ title: 'Nutrition', headerLargeTitle: true }} />
      
      {user && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && { borderBottomColor: Colors[colorScheme ?? 'light'].tint }
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'all' && { color: Colors[colorScheme ?? 'light'].tint }
            ]}>
              All Meals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'custom' && { borderBottomColor: Colors[colorScheme ?? 'light'].tint }
            ]}
            onPress={() => setActiveTab('custom')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'custom' && { color: Colors[colorScheme ?? 'light'].tint }
            ]}>
              My Custom Meals
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        {activeTab === 'custom' && userMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="restaurant-outline" 
              size={64} 
              color={Colors[colorScheme ?? 'light'].mutedText} 
            />
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
              No Custom Meals Yet
            </Text>
            <Text style={[styles.emptySubText, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
              Add your favorite recipes and track your nutrition
            </Text>
            <Button 
              mode="contained" 
              onPress={handleShowAddForm}
              style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            >
              Create Custom Meal
            </Button>
          </View>
        ) : (
          Object.entries(mealsByCategory).map(([category, meals]) => 
            meals.length > 0 && (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                {meals.map(meal => (
                  <TouchableOpacity
                    key={meal.id}
                    style={[styles.mealCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
                    onPress={() => handleMealSelected(meal)}
                  >
                    <Image 
                      source={{ uri: meal.image }} 
                      style={styles.mealImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealName, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {meal.name}
                      </Text>
                      <View style={styles.mealStats}>
                        <Text style={[styles.mealStat, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                          {meal.caloriesPer100g} kcal
                        </Text>
                        <Text style={[styles.mealStat, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                          {meal.proteinPer100g}g protein
                        </Text>
                      </View>
                      {'userId' in meal && (
                        <Chip compact style={styles.customChip}>Custom</Chip>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )
        )}
      </ScrollView>
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
        onPress={handleAddMeal}
      />
      
      {/* Meal Selector Modal */}
      <Modal
        visible={isSelectorVisible}
        animationType="slide"
        onRequestClose={handleCloseMealSelector}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.actionModal, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Text style={[styles.actionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Add Meal
            </Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setIsSelectorVisible(false);
                setIsAddFormVisible(true);
              }}
            >
              <Ionicons 
                name="create-outline" 
                size={24} 
                color={Colors[colorScheme ?? 'light'].tint} 
              />
              <Text style={[styles.actionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Create Custom Meal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setIsSelectorVisible(false);
                // Open the meal browser
                setSelectedMeal(null);
                setTimeout(() => {
                  setIsSelectorVisible(true);
                }, 300);
              }}
            >
              <Ionicons 
                name="search-outline" 
                size={24} 
                color={Colors[colorScheme ?? 'light'].tint} 
              />
              <Text style={[styles.actionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Browse Meals
              </Text>
            </TouchableOpacity>
            
            <Button 
              mode="text" 
              onPress={handleCloseMealSelector}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
      
      {/* Add Custom Meal Modal */}
      <Modal
        visible={isAddFormVisible}
        animationType="slide"
        onRequestClose={handleCancelAddMeal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background }}>
          <AddMealForm onMealAdded={handleMealAdded} onCancel={handleCancelAddMeal} />
        </SafeAreaView>
      </Modal>
      
      {/* Meal Detail Modal */}
      <Modal
        visible={isDetailVisible}
        animationType="slide"
        onRequestClose={handleCloseMealDetail}
      >
        {selectedMeal && (
          <MealDetail 
            meal={selectedMeal} 
            onClose={handleCloseMealDetail}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mealCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mealImage: {
    width: 80,
    height: 80,
  },
  mealInfo: {
    flex: 1,
    padding: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealStats: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  mealStat: {
    fontSize: 12,
    marginRight: 12,
  },
  customChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF20',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    textAlign: 'center',
    marginHorizontal: 32,
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  cancelButton: {
    marginTop: 16,
  },
});