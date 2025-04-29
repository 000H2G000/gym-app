import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

interface FoodRecognitionProps {
  onNutritionData: (data: any) => void;
  onError?: (error: string) => void;
}

// Mock food database for demonstration
const FOOD_DATABASE = [
  { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Burger", calories: 350, protein: 15, carbs: 40, fat: 17 },
  { name: "Pizza", calories: 285, protein: 12, carbs: 36, fat: 10 },
  { name: "Salad", calories: 100, protein: 3, carbs: 12, fat: 7 },
  { name: "Steak", calories: 250, protein: 26, carbs: 0, fat: 17 },
  { name: "Chicken", calories: 220, protein: 32, carbs: 0, fat: 10 },
  { name: "Rice", calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
  { name: "Salmon", calories: 206, protein: 22, carbs: 0, fat: 12 },
  { name: "Pasta", calories: 180, protein: 7, carbs: 35, fat: 1 }
];

const FoodRecognition: React.FC<FoodRecognitionProps> = ({ onNutritionData, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (onError) onError('Permission to access media library was denied');
        Alert.alert('Permission Denied', 'Permission to access media library is required');
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('Image picker result:', JSON.stringify(result));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        processImage();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (onError) onError('Failed to pick image');
    }
  };

  // Simplified image processing - using mock data instead of TensorFlow
  const processImage = async () => {
    try {
      setIsProcessing(true);
      
      console.log('Starting food image processing...');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Select random food items (2-4 items)
      const itemCount = Math.floor(Math.random() * 3) + 2;
      const selectedFoods = [];
      
      for (let i = 0; i < itemCount; i++) {
        const randomIndex = Math.floor(Math.random() * FOOD_DATABASE.length);
        selectedFoods.push(FOOD_DATABASE[randomIndex]);
      }
      
      console.log('Selected foods:', selectedFoods);
      
      // Calculate total nutrition values
      const nutritionData = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        foodItems: [] as string[]
      };
      
      selectedFoods.forEach(food => {
        nutritionData.calories += food.calories;
        nutritionData.protein += food.protein;
        nutritionData.carbs += food.carbs;
        nutritionData.fat += food.fat;
        nutritionData.foodItems.push(food.name);
      });
      
      console.log('Calling onNutritionData with:', nutritionData);
      
      // Pass the nutrition data to the parent component
      onNutritionData(nutritionData);

    } catch (error) {
      console.error('Error processing image:', error);
      if (onError) onError('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.placeholderText}>
              Select a photo of your meal to analyze its nutritional content
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={pickImage}
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.button}
              icon="image"
            >
              Choose Image
            </Button>
          </View>

          {selectedImage && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.processingText}>Analyzing image...</Text>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  cameraPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginHorizontal: 8,
  },
  previewContainer: {
    marginTop: 16,
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  processingText: {
    color: 'white',
    marginTop: 10,
  }
});

export default FoodRecognition;