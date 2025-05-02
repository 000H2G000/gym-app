import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { Text, Chip, Searchbar, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Meal, MealCategory, getMealsByCategory, getMealCategories, searchMealsByName } from '../../services/mealService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface MealSelectorProps {
  onSelectMeal: (meal: Meal) => void;
}

const MealSelector: React.FC<MealSelectorProps> = ({ onSelectMeal }) => {
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const colorScheme = useColorScheme();
  
  const categories = getMealCategories();
  
  useEffect(() => {
    // If searching, show search results, otherwise show meals by category
    if (searchQuery.trim()) {
      setMeals(searchMealsByName(searchQuery));
      setIsSearching(true);
    } else {
      setMeals(getMealsByCategory(selectedCategory));
      setIsSearching(false);
    }
  }, [selectedCategory, searchQuery]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
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
  
  const renderMealItem = ({ item }: { item: Meal }) => (
    <TouchableOpacity 
      style={[
        styles.mealCard, 
        { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
      ]}
      onPress={() => onSelectMeal(item)}
    >
      <Image source={{ uri: item.image }} style={styles.mealImage} />
      <View style={styles.mealInfo}>
        <Text 
          style={[
            styles.mealName, 
            { color: Colors[colorScheme ?? 'light'].text }
          ]}
        >
          {item.name}
        </Text>
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
              {isSearching ? 'No meals found' : 'No meals available'}
            </Text>
          </View>
        }
      />
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
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
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
});

export default MealSelector;