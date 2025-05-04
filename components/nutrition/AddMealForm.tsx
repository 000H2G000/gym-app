import React, { useState, useContext } from 'react';
import {
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  Alert,
  TouchableOpacity
} from 'react-native';
import { Text, Button, SegmentedButtons, Chip, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MealCategory, addCustomMeal } from '@/services/mealService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext } from '../../app/_layout';

interface AddMealFormProps {
  onMealAdded: () => void;
  onCancel: () => void;
}

const AddMealForm: React.FC<AddMealFormProps> = ({ onMealAdded, onCancel }) => {
  const colorScheme = useColorScheme();
  const { user } = useContext(AuthContext);
  
  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MealCategory>('dinner');
  const [caloriesPer100g, setCaloriesPer100g] = useState('');
  const [proteinPer100g, setProteinPer100g] = useState('');
  const [carbsPer100g, setCarbsPer100g] = useState('');
  const [fatPer100g, setFatPer100g] = useState('');
  const [servingSizeGrams, setServingSizeGrams] = useState('200');
  const [defaultServings, setDefaultServings] = useState('1');
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Dynamic list inputs
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [recipe, setRecipe] = useState<string[]>(['']);
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add a new ingredient input
  const addIngredientInput = () => {
    setIngredients([...ingredients, '']);
  };
  
  // Update ingredient at specific index
  const updateIngredient = (text: string, index: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = text;
    setIngredients(newIngredients);
  };
  
  // Remove ingredient at specific index
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = [...ingredients];
      newIngredients.splice(index, 1);
      setIngredients(newIngredients);
    }
  };
  
  // Add a new recipe step input
  const addRecipeStepInput = () => {
    setRecipe([...recipe, '']);
  };
  
  // Update recipe step at specific index
  const updateRecipeStep = (text: string, index: number) => {
    const newRecipe = [...recipe];
    newRecipe[index] = text;
    setRecipe(newRecipe);
  };
  
  // Remove recipe step at specific index
  const removeRecipeStep = (index: number) => {
    if (recipe.length > 1) {
      const newRecipe = [...recipe];
      newRecipe.splice(index, 1);
      setRecipe(newRecipe);
    }
  };
  
  // Pick an image for the meal
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Need permission to access your photos');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // Upload image to Firebase Storage and get URL
  const uploadImage = async (): Promise<string> => {
    if (!imageUri) {
      // Return a default image URL if no image was selected
      return 'https://via.placeholder.com/500x300?text=No+Image+Selected';
    }
    
    try {
      const storage = getStorage();
      const filename = imageUri.substring(imageUri.lastIndexOf('/') + 1);
      const storageRef = ref(storage, `mealImages/${user?.uid}/${Date.now()}-${filename}`);
      
      // Fetch the image as a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };
  
  // Validate form before submitting
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Meal name is required";
    }
    
    if (!caloriesPer100g || isNaN(Number(caloriesPer100g))) {
      newErrors.calories = "Valid calories number is required";
    }
    
    if (!proteinPer100g || isNaN(Number(proteinPer100g))) {
      newErrors.protein = "Valid protein number is required";
    }
    
    if (!carbsPer100g || isNaN(Number(carbsPer100g))) {
      newErrors.carbs = "Valid carbs number is required";
    }
    
    if (!fatPer100g || isNaN(Number(fatPer100g))) {
      newErrors.fat = "Valid fat number is required";
    }
    
    if (!servingSizeGrams || isNaN(Number(servingSizeGrams)) || Number(servingSizeGrams) <= 0) {
      newErrors.servingSize = "Valid serving size is required";
    }
    
    const validIngredients = ingredients.filter(i => i.trim() !== '');
    if (validIngredients.length === 0) {
      newErrors.ingredients = "At least one ingredient is required";
    }
    
    const validRecipeSteps = recipe.filter(r => r.trim() !== '');
    if (validRecipeSteps.length === 0) {
      newErrors.recipe = "At least one recipe step is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit the form
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'You need to be logged in to add custom meals.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Upload image and get URL
      const imageUrl = await uploadImage();
      
      // Filter out empty inputs
      const validIngredients = ingredients.filter(i => i.trim() !== '');
      const validRecipe = recipe.filter(r => r.trim() !== '');
      
      // Prepare meal data
      const mealData = {
        name,
        category,
        caloriesPer100g: Number(caloriesPer100g),
        proteinPer100g: Number(proteinPer100g),
        carbsPer100g: Number(carbsPer100g),
        fatPer100g: Number(fatPer100g),
        servingSizeGrams: Number(servingSizeGrams),
        defaultServings: Number(defaultServings),
        image: imageUrl,
        ingredients: validIngredients,
        recipe: validRecipe,
      };
      
      // Add to Firebase
      await addCustomMeal(user.uid, mealData);
      
      Alert.alert(
        'Success', 
        'Your meal has been added!',
        [
          { text: 'OK', onPress: onMealAdded }
        ]
      );
    } catch (error) {
      console.error('Error adding meal:', error);
      Alert.alert('Error', 'Failed to add your meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Add Custom Meal
          </Text>
        </View>
        
        {/* Meal Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Meal Name*
          </Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                color: Colors[colorScheme ?? 'light'].text,
              },
              errors.name ? styles.inputError : null
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter meal name"
            placeholderTextColor="#888"
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
        
        {/* Meal Category */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Category*
          </Text>
          <SegmentedButtons
            value={category}
            onValueChange={value => setCategory(value as MealCategory)}
            buttons={[
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
            ]}
            style={styles.segmentedButtons}
          />
          <View style={styles.additionalCategories}>
            <Chip
              selected={category === 'snack'}
              onPress={() => setCategory('snack')}
              style={styles.categoryChip}
            >
              Snack
            </Chip>
            <Chip
              selected={category === 'dessert'}
              onPress={() => setCategory('dessert')}
              style={styles.categoryChip}
            >
              Dessert
            </Chip>
          </View>
        </View>
        
        {/* Meal Image */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Meal Image
          </Text>
          <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.mealImage} />
            ) : (
              <View style={[
                styles.imagePlaceholder,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
              ]}>
                <Text style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
                  Tap to select an image
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Nutrition Facts */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Nutrition Facts* (per 100g)
          </Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionInput}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Calories</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  },
                  errors.calories ? styles.inputError : null
                ]}
                value={caloriesPer100g}
                onChangeText={setCaloriesPer100g}
                placeholder="kcal"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              {errors.calories ? <Text style={styles.errorText}>{errors.calories}</Text> : null}
            </View>
            
            <View style={styles.nutritionInput}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Protein</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  },
                  errors.protein ? styles.inputError : null
                ]}
                value={proteinPer100g}
                onChangeText={setProteinPer100g}
                placeholder="g"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              {errors.protein ? <Text style={styles.errorText}>{errors.protein}</Text> : null}
            </View>
          </View>
          
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionInput}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Carbs</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  },
                  errors.carbs ? styles.inputError : null
                ]}
                value={carbsPer100g}
                onChangeText={setCarbsPer100g}
                placeholder="g"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              {errors.carbs ? <Text style={styles.errorText}>{errors.carbs}</Text> : null}
            </View>
            
            <View style={styles.nutritionInput}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Fat</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  },
                  errors.fat ? styles.inputError : null
                ]}
                value={fatPer100g}
                onChangeText={setFatPer100g}
                placeholder="g"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              {errors.fat ? <Text style={styles.errorText}>{errors.fat}</Text> : null}
            </View>
          </View>
        </View>
        
        {/* Serving Size */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Serving Information*
          </Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionInput}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Serving Size</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  },
                  errors.servingSize ? styles.inputError : null
                ]}
                value={servingSizeGrams}
                onChangeText={setServingSizeGrams}
                placeholder="grams"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              {errors.servingSize ? <Text style={styles.errorText}>{errors.servingSize}</Text> : null}
            </View>
            
            <View style={styles.nutritionInput}>
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Default Servings</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={defaultServings}
                onChangeText={setDefaultServings}
                placeholder="count"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
        
        {/* Ingredients */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Ingredients*
          </Text>
          {errors.ingredients ? <Text style={styles.errorText}>{errors.ingredients}</Text> : null}
          
          {ingredients.map((ingredient, index) => (
            <View key={`ingredient-${index}`} style={styles.listInputRow}>
              <TextInput
                style={[
                  styles.input, 
                  styles.listInput,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={ingredient}
                onChangeText={text => updateIngredient(text, index)}
                placeholder={`Ingredient ${index + 1}`}
                placeholderTextColor="#888"
              />
              <IconButton
                icon="minus-circle"
                size={24}
                onPress={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
              />
            </View>
          ))}
          
          <Button
            mode="outlined"
            onPress={addIngredientInput}
            style={styles.addButton}
          >
            Add Ingredient
          </Button>
        </View>
        
        {/* Recipe Steps */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
            Recipe Steps*
          </Text>
          {errors.recipe ? <Text style={styles.errorText}>{errors.recipe}</Text> : null}
          
          {recipe.map((step, index) => (
            <View key={`step-${index}`} style={styles.listInputRow}>
              <View style={styles.stepNumberContainer}>
                <Text style={[styles.stepNumber, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  {index + 1}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input, 
                  styles.listInput,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={step}
                onChangeText={text => updateRecipeStep(text, index)}
                placeholder={`Step ${index + 1}`}
                placeholderTextColor="#888"
                multiline
              />
              <IconButton
                icon="minus-circle"
                size={24}
                onPress={() => removeRecipeStep(index)}
                disabled={recipe.length === 1}
              />
            </View>
          ))}
          
          <Button
            mode="outlined"
            onPress={addRecipeStepInput}
            style={styles.addButton}
          >
            Add Step
          </Button>
        </View>
        
        {/* Form Actions */}
        <View style={styles.formActions}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.button, styles.submitButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Add Meal
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  additionalCategories: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    minWidth: 80,
  },
  imagePickerButton: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  nutritionInput: {
    flex: 1,
  },
  listInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listInput: {
    flex: 1,
  },
  stepNumberContainer: {
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
  },
  addButton: {
    marginTop: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: '#999',
  },
  submitButton: {
    borderRadius: 8,
  },
});

export default AddMealForm;