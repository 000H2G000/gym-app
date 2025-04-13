import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext } from '../_layout';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { Text, Button, Dialog, Portal, Card, ProgressBar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';

// Define the user type for TypeScript
type User = {
  uid: string;
  email?: string;
};

// Define the edited data type
interface EditedData {
  fullName?: string;
  weight?: string;
  height?: string;
  [key: string]: string | undefined;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext) as { user: User | null };
  const [userData, setUserData] = useState({
    fullName: '',
    photoURL: '',
    gymPoints: 0,
    weight: '',
    height: '',
    caloriesBurned: 250,
    workoutsCompleted: 5,
    totalExercises: 12
  });
  
  const [loading, setLoading] = useState(true);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editedData, setEditedData] = useState<EditedData>({});
  const colorScheme = useColorScheme();

  // Add a border color variable instead of relying on Colors
  const borderColor = colorScheme === 'dark' ? '#444' : '#ddd';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData({...userData, ...userDoc.data()});
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to quit the app?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes, Logout", 
          style: "destructive",
          onPress: () => {
            // Forcefully redirect to login page first
            try {
              // More direct approach - force navigate first
              router.replace('/auth/login');
              
              // Then attempt to sign out Firebase in the background after a delay
              setTimeout(() => {
                try {
                  signOut(auth);
                  console.log("User signed out successfully");
                } catch (signOutError) {
                  console.error("Error in sign out:", signOutError);
                }
              }, 500);
            } catch (error) {
              console.error("Navigation error:", error);
              
              // If router fails, try direct navigation
              signOut(auth).then(() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/login';
                }
              });
            }
          }
        }
      ]
    );
  };
  
  const calculateBMI = () => {
    if (userData.weight && userData.height) {
      const weightKg = parseFloat(userData.weight);
      const heightM = parseFloat(userData.height) / 100; // Convert cm to m
      if (weightKg > 0 && heightM > 0) {
        return (weightKg / (heightM * heightM)).toFixed(1);
      }
    }
    return "N/A";
  };
  
  const getBMICategory = (bmi: string) => {
    if (bmi === "N/A") return { text: "N/A", color: "#CCCCCC" };
    
    const numBmi = parseFloat(bmi);
    if (numBmi < 18.5) return { text: "Underweight", color: "#64B5F6" };
    if (numBmi < 25) return { text: "Normal", color: "#66BB6A" };
    if (numBmi < 30) return { text: "Overweight", color: "#FFA726" };
    return { text: "Obese", color: "#EF5350" };
  };
  
  const handleEditProfile = () => {
    setEditedData({
      fullName: userData.fullName || '',
      weight: userData.weight || '',
      height: userData.height || ''
    });
    setEditDialogVisible(true);
  };
  
  const handleSaveProfile = async () => {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), editedData);
        setUserData({...userData, ...editedData});
        setEditDialogVisible(false);
        Alert.alert("Success", "Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      </SafeAreaView>
    );
  }
  
  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Profile
          </Text>
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: borderColor }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.logoutText, { color: Colors[colorScheme ?? 'light'].text }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                <Text style={styles.avatarInitial}>
                  {userData?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
              <Ionicons name="camera-outline" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {userData?.fullName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
            {user?.email || 'No email available'}
          </Text>
          
          <Button 
            mode="outlined" 
            icon="account-edit" 
            onPress={handleEditProfile}
            style={styles.editProfileButton}
          >
            Edit Profile
          </Button>
        </View>
        
        {/* Health Metrics Card */}
        <Card style={[styles.metricsCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Card.Title title="Health Metrics" />
          <Card.Content>
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Weight</Text>
                <Text style={styles.metricValue}>{userData.weight ? `${userData.weight} kg` : 'Not set'}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Height</Text>
                <Text style={styles.metricValue}>{userData.height ? `${userData.height} cm` : 'Not set'}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>BMI</Text>
                <Text style={styles.metricValue}>{bmi}</Text>
                {bmi !== "N/A" && (
                  <View style={[styles.bmiCategory, { backgroundColor: bmiCategory.color + '20' }]}>
                    <Text style={[styles.bmiCategoryText, { color: bmiCategory.color }]}>
                      {bmiCategory.text}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {bmi !== "N/A" && (
              <View style={styles.bmiProgress}>
                <ProgressBar 
                  progress={Math.min(parseFloat(bmi) / 35, 1)}
                  color={bmiCategory.color}
                  style={{ height: 8, borderRadius: 4 }}
                />
                <View style={styles.bmiRange}>
                  <Text style={styles.bmiRangeText}>Underweight</Text>
                  <Text style={styles.bmiRangeText}>Normal</Text>
                  <Text style={styles.bmiRangeText}>Overweight</Text>
                  <Text style={styles.bmiRangeText}>Obese</Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Activity Card */}
        <Card style={[styles.activityCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <Card.Title title="Activity Summary" />
          <Card.Content>
            <View style={styles.activityStats}>
              <View style={styles.activityItem}>
                <Ionicons name="flame" size={28} color="#FF7043" />
                <Text style={styles.activityValue}>{userData.caloriesBurned || 0}</Text>
                <Text style={styles.activityLabel}>Calories Burned</Text>
              </View>
              
              <View style={styles.activityItem}>
                <Ionicons name="barbell" size={28} color="#5C6BC0" />
                <Text style={styles.activityValue}>{userData.workoutsCompleted || 0}</Text>
                <Text style={styles.activityLabel}>Workouts</Text>
              </View>
              
              <View style={styles.activityItem}>
                <Ionicons name="fitness" size={28} color="#66BB6A" />
                <Text style={styles.activityValue}>{userData.totalExercises || 0}</Text>
                <Text style={styles.activityLabel}>Exercises</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={[styles.gymPointsCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <View style={styles.gymPointsContent}>
            <Text style={[styles.gymPointsLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
              Gym Points
            </Text>
            <Text style={[styles.gymPointsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {userData?.gymPoints || 0}
            </Text>
          </View>
          <View style={[styles.gymPointsBadge, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
            <Text style={[styles.gymPointsRank, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {userData?.gymPoints >= 100 ? 'Gold' : userData?.gymPoints >= 50 ? 'Silver' : 'Bronze'}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Settings
          </Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
            onPress={handleEditProfile}
          >
            <Ionicons name="person-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Edit Profile
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="notifications-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Notifications
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="help-circle-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Help & Support
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={editedData.fullName || ''}
              onChangeText={(text) => setEditedData({...editedData, fullName: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              value={editedData.weight || ''}
              onChangeText={(text) => setEditedData({...editedData, weight: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              value={editedData.height || ''}
              onChangeText={(text) => setEditedData({...editedData, height: text})}
              keyboardType="numeric"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveProfile}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 10,
  },
  editProfileButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  metricsCard: {
    margin: 16,
    borderRadius: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '30%',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bmiCategory: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  bmiCategoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bmiProgress: {
    marginTop: 16,
  },
  bmiRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bmiRangeText: {
    fontSize: 10,
    color: '#888',
  },
  activityCard: {
    margin: 16,
    borderRadius: 12,
    marginTop: 0,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityItem: {
    alignItems: 'center',
    padding: 8,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  gymPointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    marginTop: 0,
  },
  gymPointsContent: {
    flex: 1,
  },
  gymPointsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  gymPointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gymPointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gymPointsRank: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  menuSection: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
}); 