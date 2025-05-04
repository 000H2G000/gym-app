import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, Chip, Searchbar, Divider, FAB, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { 
  Meal, 
  MealCategory, 
  getMealsByCategory, 
  getMealCategories, 
  searchMealsByName,
  UserMeal,
  getAllMealsByCategoryWithCustom
} from '../../services/mealService';
import { AuthContext } from '../../app/_layout';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AddMealForm from './AddMealForm';

interface MealSelectorProps {
  onSelectMeal: (meal: Meal | UserMeal) => void;
}

const MealSelector: React.FC<MealSelectorProps> = ({ onSelectMeal }) => {
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [meals, setMeals] = useState<(Meal | UserMeal)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const { user } = useContext(AuthContext);
  
  const categories = getMealCategories();
  
  useEffect(() => {
    loadMeals();
  }, [selectedCategory, searchQuery, user]);
  
  const loadMeals = async () => {
    setIsLoading(true);
    try {
      // If searching, show search results, otherwise show meals by category
      if (searchQuery.trim()) {
        // For now, we just search built-in meals
        // Could extend to search custom meals as well
        setMeals(searchMealsByName(searchQuery));
        setIsSearching(true);
      } else {
        // Get all meals including custom ones if user is logged in
        if (user) {
          const allMeals = await getAllMealsByCategoryWithCustom(user.uid, selectedCategory);
          setMeals(allMeals);
        } else {
          // Fallback to only built-in meals if user is not logged in
          setMeals(getMealsByCategory(selectedCategory));
        }
        setIsSearching(false);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };
  
  const handleAddMealComplete = () => {
    setIsAddingMeal(false);
    loadMeals(); // Reload meals to include the newly added one
  };
  
  const renderCategoryChip = (category: MealCategory) => {
    const isSelected = category === selectedCategory;
    
    return (
      <Chip
        key={category}
        selected={isSelected}
        onPress={() => setSelectedCategory(category)}
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? 
              Colors[colorScheme ?? 'light'].tint : 
              Colors[colorScheme ?? 'light'].cardBackground
          }
        ]}
      >
        <Text 
          style={{ 
            color: isSelected ? 'white' : Colors[colorScheme ?? 'light'].text,
            textTransform: 'capitalize'
          }}
        >
          {category}
        </Text>
      </Chip>
    );
  };
  
  const renderMealItem = ({ item }: { item: Meal | UserMeal }) => {
    const isCustom = 'isCustom' in item && item.isCustom;
    
    return (
      <TouchableOpacity 
        style={[
          styles.mealCard, 
          { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
        ]}
        onPress={() => onSelectMeal(item)}
      >
        <Image source={{ uri: item.image }} style={styles.mealImage} />
        <View style={styles.mealInfo}>
          <View style={styles.mealNameContainer}>
            <Text 
              style={[
                styles.mealName, 
                { color: Colors[colorScheme ?? 'light'].text }
              ]}
            >
              {item.name}
            </Text>
            {isCustom && (
              <Badge size={20} style={styles.customBadge}>My</Badge>
            )}
          </View>
          <View style={styles.mealStats}>
            <View style={styles.mealStat}>
              <Ionicons name="flame-outline" size={14} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={styles.mealStatText}>
                {item.caloriesPer100g} kcal/100g
              </Text>
            </View>
            <View style={styles.mealStat}>
              <Ionicons name="barbell-outline" size={14} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={styles.mealStatText}>
                {item.proteinPer100g}g protein
              </Text>
            </View>
          </View>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={Colors[colorScheme ?? 'light'].mutedText} 
          style={styles.arrowIcon}
        />
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search meals..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={[
          styles.searchBar,
          { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
        ]}
        iconColor={Colors[colorScheme ?? 'light'].tint}
        clearIcon={() => searchQuery ? (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
        ) : undefined}
      />
      
      {!isSearching && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={({ item }) => renderCategoryChip(item)}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}
      
      <FlatList
        data={meals}
        renderItem={renderMealItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="nutrition-outline" 
              size={50} 
              color={Colors[colorScheme ?? 'light'].mutedText} 
            />
            <Text style={{ color: Colors[colorScheme ?? 'light'].mutedText, marginTop: 10 }}>
              {isLoading 
                ? 'Loading meals...' 
                : isSearching 
                  ? 'No meals found' 
                  : 'No meals available'}
            </Text>
            {!isLoading && !isSearching && (
              <TouchableOpacity 
                onPress={() => setIsAddingMeal(true)}
                style={styles.addMealButton}
              >
                <Text style={{ color: Colors[colorScheme ?? 'light'].tint }}>
                  Add a custom meal
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      {/* FAB to add custom meal */}
      {user && (
        <FAB
          icon="plus"
          style={[
            styles.fab,
            { backgroundColor: Colors[colorScheme ?? 'light'].tint }
          ]}
          onPress={() => setIsAddingMeal(true)}
        />
      )}
      
      {/* Modal for adding a new meal */}
      <Modal
        visible={isAddingMeal}
        animationType="slide"
        onRequestClose={() => setIsAddingMeal(false)}
      >
        <View style={{ flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setIsAddingMeal(false)}
              style={styles.closeButton}
            >
              <Ionicons 
                name="close" 
                size={28} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
            </TouchableOpacity>
          </View>
          <AddMealForm onComplete={handleAddMealComplete} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  mealImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 16,
  },
  mealNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 6,
  },
  customBadge: {
    backgroundColor: '#FF6B6B',
  },
  mealStats: {
    flexDirection: 'row',
  },
  mealStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  mealStatText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  arrowIcon: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealButton: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
  },
});

export default MealSelector;