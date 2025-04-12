import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, TextInput, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  category: string;
}

export default function NutritionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [myFoods, setMyFoods] = useState<FoodItem[]>([]);
  const colorScheme = useColorScheme();

  // Mock food data
  useEffect(() => {
    const mockFoodItems: FoodItem[] = [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        imageUrl: 'https://www.thespruceeats.com/thmb/GFwGKe65JLYQEkQcGW0r1LRqCcA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/garlic-herb-grilled-chicken-breasts-recipe-334150-hero-01-7eb7cc1c76e64b1d9d569d3bc05414c7.jpg',
        category: 'Protein',
      },
      {
        id: '2',
        name: 'Salmon Fillet',
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 13,
        imageUrl: 'https://www.primaverakitchen.com/wp-content/uploads/2019/03/Air-Fryer-Salmon-Recipe-Primavera-Kitchen-4.jpg',
        category: 'Protein',
      },
      {
        id: '3',
        name: 'Brown Rice',
        calories: 216,
        protein: 5,
        carbs: 45,
        fat: 1.8,
        imageUrl: 'https://www.thespruceeats.com/thmb/EJIUwYL0mGhEjOyCpQHlXMcD9Vw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/how-to-make-basic-brown-rice-2355042-hero-01-626691104a204941a3286bfa4d36403f.jpg',
        category: 'Carbs',
      },
      {
        id: '4',
        name: 'Sweet Potato',
        calories: 112,
        protein: 2,
        carbs: 26,
        fat: 0.1,
        imageUrl: 'https://food.fnr.sndimg.com/content/dam/images/food/fullset/2013/9/19/1/FNK_Baked-Sweet-Potato_s4x3.jpg.rend.hgtvcom.616.462.suffix/1383770571120.jpeg',
        category: 'Carbs',
      },
      {
        id: '5',
        name: 'Avocado',
        calories: 240,
        protein: 3,
        carbs: 12,
        fat: 22,
        imageUrl: 'https://www.thespruceeats.com/thmb/N1-jBnxneoVeH6rqE2jBJGg4sNo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Avocadohero-f147aaed62fa4755896be7c3cf179003.jpg',
        category: 'Fats',
      },
      {
        id: '6',
        name: 'Greek Yogurt',
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.4,
        imageUrl: 'https://www.thespruceeats.com/thmb/WmK0hbQEU-3YM3Cp_0RzV_pxmJ0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/tzatziki-57a26c3f3df78c3276fa8e22.jpg',
        category: 'Dairy',
      },
      {
        id: '7',
        name: 'Broccoli',
        calories: 55,
        protein: 3.7,
        carbs: 11,
        fat: 0.6,
        imageUrl: 'https://www.thespruceeats.com/thmb/0MxN7smiW1p3QsRCI0HfrFk9mKA=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1156024582-465e5db2c0bc442c95657305ab9aed8d.jpg',
        category: 'Vegetables',
      },
    ];
    
    setFoodItems(mockFoodItems);
    setFilteredFoodItems(mockFoodItems);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFoodItems(foodItems);
    } else {
      const filtered = foodItems.filter(
        (food) =>
          food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          food.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFoodItems(filtered);
    }
  }, [searchQuery, foodItems]);

  const handleFoodPress = (food: FoodItem) => {
    setSelectedFood(food);
  };

  const addToMyFoods = (food: FoodItem) => {
    setMyFoods([...myFoods, food]);
    setSelectedFood(null);
  };

  const removeFromMyFoods = (foodId: string) => {
    setMyFoods(myFoods.filter(food => food.id !== foodId));
  };

  const closeModal = () => {
    setSelectedFood(null);
  };

  const calculateTotalCalories = () => {
    return myFoods.reduce((total, food) => total + food.calories, 0);
  };

  const calculateTotalMacros = () => {
    return {
      protein: myFoods.reduce((total, food) => total + food.protein, 0),
      carbs: myFoods.reduce((total, food) => total + food.carbs, 0),
      fat: myFoods.reduce((total, food) => total + food.fat, 0),
    };
  };

  const totalMacros = calculateTotalMacros();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Nutrition
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            placeholder="Search foods..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {myFoods.length > 0 && (
          <View style={styles.myFoodsSection}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              My Food Tracker
            </Text>
            
            <View style={[styles.calorieCounter, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
              <Text style={[styles.calorieTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Total Calories
              </Text>
              <Text style={[styles.calorieValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                {calculateTotalCalories()}
              </Text>
              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>Protein</Text>
                  <Text style={[styles.macroValue, { color: Colors[colorScheme ?? 'light'].text }]}>{totalMacros.protein}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>Carbs</Text>
                  <Text style={[styles.macroValue, { color: Colors[colorScheme ?? 'light'].text }]}>{totalMacros.carbs}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>Fat</Text>
                  <Text style={[styles.macroValue, { color: Colors[colorScheme ?? 'light'].text }]}>{totalMacros.fat}g</Text>
                </View>
              </View>
            </View>

            <FlatList
              data={myFoods}
              keyExtractor={(item) => item.id}
              horizontal={false}
              renderItem={({ item }) => (
                <View style={[styles.myFoodItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
                  <Image source={{ uri: item.imageUrl }} style={styles.myFoodImage} />
                  <View style={styles.myFoodInfo}>
                    <Text style={[styles.myFoodName, { color: Colors[colorScheme ?? 'light'].text }]}>{item.name}</Text>
                    <Text style={[styles.myFoodCalories, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                      {item.calories} calories
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromMyFoods(item.id)}
                  >
                    <Text style={{ color: Colors[colorScheme ?? 'light'].tint }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={styles.myFoodsList}
            />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Food Database
        </Text>

        <View style={styles.foodGrid}>
          {filteredFoodItems.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={[
                styles.foodCard,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
              ]}
              onPress={() => handleFoodPress(food)}
            >
              <Image source={{ uri: food.imageUrl }} style={styles.foodImage} />
              <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {food.name}
                </Text>
                <Text style={[styles.foodCalories, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                  {food.calories} calories
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedFood && (
        <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ScrollView>
            <Image source={{ uri: selectedFood.imageUrl }} style={styles.modalImage} />
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedFood.name}
              </Text>
              <Text style={[styles.modalSubtitle, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                {selectedFood.category}
              </Text>
              
              <View style={styles.nutritionGrid}>
                <View style={[styles.nutritionItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
                  <Text style={[styles.nutritionValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedFood.calories}
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                    Calories
                  </Text>
                </View>
                <View style={[styles.nutritionItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
                  <Text style={[styles.nutritionValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedFood.protein}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                    Protein
                  </Text>
                </View>
                <View style={[styles.nutritionItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
                  <Text style={[styles.nutritionValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedFood.carbs}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                    Carbs
                  </Text>
                </View>
                <View style={[styles.nutritionItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
                  <Text style={[styles.nutritionValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedFood.fat}g
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                    Fat
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: 'transparent', borderColor: Colors[colorScheme ?? 'light'].border, borderWidth: 1 }]}
              onPress={closeModal}
            >
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={() => addToMyFoods(selectedFood)}
            >
              <Text style={styles.addButtonText}>Add to My Foods</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  myFoodsSection: {
    marginBottom: 16,
  },
  calorieCounter: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  calorieTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  calorieValue: {
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  macrosContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  myFoodsList: {
    marginHorizontal: 16,
  },
  myFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  myFoodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  myFoodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  myFoodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  myFoodCalories: {
    fontSize: 14,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  foodCard: {
    width: '46%',
    margin: '2%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  foodImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  foodInfo: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foodCalories: {
    fontSize: 14,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  modalContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 