import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface PersonalRecord {
  lift: string;
  weight: number;
  unit: 'kg' | 'lb';
  date: string;
}

interface Lifter {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  specialties: string[];
  profileImage: string;
  totalScore: number;
  personalRecords: PersonalRecord[];
}

export default function LeaderboardScreen() {
  const [lifters, setLifters] = useState<Lifter[]>([]);
  const [filteredLifters, setFilteredLifters] = useState<Lifter[]>([]);
  const [selectedLifter, setSelectedLifter] = useState<Lifter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLift, setFilterLift] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  
  const commonLifts = [
    'Bench Press',
    'Squat',
    'Deadlift',
    'Overhead Press',
    'Barbell Row'
  ];

  // Mock lifters data with personal records
  useEffect(() => {
    const mockLifters: Lifter[] = [
      {
        id: '1',
        name: 'Alex Wilson',
        age: 28,
        location: 'Downtown',
        bio: 'Competitive powerlifter focused on strength. Current state champion in my weight class.',
        specialties: ['Powerlifting', 'Strength Training', 'Coaching'],
        profileImage: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        totalScore: 1350,
        personalRecords: [
          { lift: 'Bench Press', weight: 315, unit: 'lb', date: '2023-10-12' },
          { lift: 'Squat', weight: 455, unit: 'lb', date: '2023-09-05' },
          { lift: 'Deadlift', weight: 585, unit: 'lb', date: '2023-11-20' },
          { lift: 'Overhead Press', weight: 185, unit: 'lb', date: '2023-08-14' },
          { lift: 'Barbell Row', weight: 275, unit: 'lb', date: '2023-07-30' }
        ]
      },
      {
        id: '2',
        name: 'Jamie Chen',
        age: 32,
        location: 'Midtown',
        bio: 'CrossFit athlete and former gymnast with focus on functional strength and mobility.',
        specialties: ['CrossFit', 'Olympic Lifting', 'Gymnastics'],
        profileImage: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        totalScore: 1180,
        personalRecords: [
          { lift: 'Bench Press', weight: 225, unit: 'lb', date: '2023-10-05' },
          { lift: 'Squat', weight: 365, unit: 'lb', date: '2023-09-12' },
          { lift: 'Deadlift', weight: 405, unit: 'lb', date: '2023-11-10' },
          { lift: 'Overhead Press', weight: 165, unit: 'lb', date: '2023-08-07' },
          { lift: 'Barbell Row', weight: 235, unit: 'lb', date: '2023-07-24' }
        ]
      },
      {
        id: '3',
        name: 'Taylor Morgan',
        age: 25,
        location: 'Uptown',
        bio: 'Bodybuilding champion with a focus on aesthetics and symmetry. Preparing for nationals.',
        specialties: ['Bodybuilding', 'Hypertrophy', 'Posing'],
        profileImage: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        totalScore: 1420,
        personalRecords: [
          { lift: 'Bench Press', weight: 345, unit: 'lb', date: '2023-11-12' },
          { lift: 'Squat', weight: 495, unit: 'lb', date: '2023-10-22' },
          { lift: 'Deadlift', weight: 585, unit: 'lb', date: '2023-11-28' },
          { lift: 'Overhead Press', weight: 205, unit: 'lb', date: '2023-09-14' },
          { lift: 'Barbell Row', weight: 295, unit: 'lb', date: '2023-08-18' }
        ]
      },
      {
        id: '4',
        name: 'Jordan Lee',
        age: 29,
        location: 'Eastside',
        bio: 'Strongman competitor specializing in odd object lifts and endurance events.',
        specialties: ['Strongman', 'Grip Strength', 'Carries'],
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        totalScore: 1310,
        personalRecords: [
          { lift: 'Bench Press', weight: 275, unit: 'lb', date: '2023-10-18' },
          { lift: 'Squat', weight: 435, unit: 'lb', date: '2023-09-25' },
          { lift: 'Deadlift', weight: 605, unit: 'lb', date: '2023-11-15' },
          { lift: 'Overhead Press', weight: 195, unit: 'lb', date: '2023-08-22' },
          { lift: 'Barbell Row', weight: 255, unit: 'lb', date: '2023-07-19' }
        ]
      },
      {
        id: '5',
        name: 'Casey Rivera',
        age: 34,
        location: 'Westside',
        bio: 'Olympic weightlifter with competitive experience at national level. Focused on technique.',
        specialties: ['Olympic Lifting', 'Clean & Jerk', 'Snatch'],
        profileImage: 'https://images.unsplash.com/photo-1517630800677-932d836c22d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        totalScore: 1250,
        personalRecords: [
          { lift: 'Bench Press', weight: 255, unit: 'lb', date: '2023-10-28' },
          { lift: 'Squat', weight: 425, unit: 'lb', date: '2023-09-18' },
          { lift: 'Deadlift', weight: 485, unit: 'lb', date: '2023-11-05' },
          { lift: 'Overhead Press', weight: 215, unit: 'lb', date: '2023-08-30' },
          { lift: 'Barbell Row', weight: 245, unit: 'lb', date: '2023-07-12' }
        ]
      },
    ];
    
    // Sort lifters by total score (descending)
    const sortedLifters = [...mockLifters].sort((a, b) => b.totalScore - a.totalScore);
    
    setLifters(sortedLifters);
    setFilteredLifters(sortedLifters);
  }, []);

  // Search and filter functionality
  useEffect(() => {
    let filtered = [...lifters];
    
    // Apply text search if query exists
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (lifter) =>
          lifter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lifter.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lifter.specialties.some(specialty => 
            specialty.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }
    
    // Apply lift filter if selected
    if (filterLift) {
      filtered = filtered.sort((a, b) => {
        const aRecord = a.personalRecords.find(record => record.lift === filterLift)?.weight || 0;
        const bRecord = b.personalRecords.find(record => record.lift === filterLift)?.weight || 0;
        return bRecord - aRecord;
      });
    } else {
      // Default sort by total score
      filtered = filtered.sort((a, b) => b.totalScore - a.totalScore);
    }
    
    setFilteredLifters(filtered);
  }, [searchQuery, filterLift, lifters]);

  const handleLifterPress = (lifter: Lifter) => {
    setSelectedLifter(lifter);
  };

  const closeLifterDetails = () => {
    setSelectedLifter(null);
  };

  const getBadgeColor = (index: number) => {
    switch(index) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return Colors[colorScheme ?? 'light'].cardBackground;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Lifting Leaderboard
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            placeholder="Search by name, location, or specialty..."
            placeholderTextColor="#757575"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterLift && { 
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
              }
            ]}
            onPress={() => setFilterLift(null)}
          >
            <Text style={{ 
              color: !filterLift ? 'white' : Colors[colorScheme ?? 'light'].text,
              fontWeight: !filterLift ? 'bold' : 'normal'
            }}>
              Total
            </Text>
          </TouchableOpacity>
          
          {commonLifts.map(lift => (
            <TouchableOpacity
              key={lift}
              style={[
                styles.filterChip,
                filterLift === lift && { 
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                }
              ]}
              onPress={() => setFilterLift(lift)}
            >
              <Text style={{ 
                color: filterLift === lift ? 'white' : Colors[colorScheme ?? 'light'].text,
                fontWeight: filterLift === lift ? 'bold' : 'normal'
              }}>
                {lift}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.rankHeader, { color: Colors[colorScheme ?? 'light'].text }]}>Rank</Text>
        <Text style={[styles.nameHeader, { color: Colors[colorScheme ?? 'light'].text }]}>Lifter</Text>
        <Text style={[styles.scoreHeader, { color: Colors[colorScheme ?? 'light'].text }]}>
          {filterLift ? filterLift : 'Total'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredLifters.map((lifter, index) => (
          <TouchableOpacity
            key={lifter.id}
            style={[
              styles.lifterRow,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            onPress={() => handleLifterPress(lifter)}
          >
            <View style={[styles.rankBadge, { backgroundColor: getBadgeColor(index) }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            
            <View style={styles.lifterInfo}>
              <Image source={{ uri: lifter.profileImage }} style={styles.lifterImage} />
              <View>
                <Text style={[styles.lifterName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {lifter.name}
                </Text>
                <Text style={[styles.lifterLocation, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                  {lifter.location}
                </Text>
                <View style={styles.specialtiesContainer}>
                  {lifter.specialties.slice(0, 2).map((specialty, i) => (
                    <View
                      key={i}
                      style={[
                        styles.specialtyTag,
                        { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                      ]}
                    >
                      <Text style={[styles.specialtyText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                        {specialty}
                      </Text>
                    </View>
                  ))}
                  {lifter.specialties.length > 2 && (
                    <View
                      style={[
                        styles.specialtyTag,
                        { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                      ]}
                    >
                      <Text style={[styles.specialtyText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                        +{lifter.specialties.length - 2}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {filterLift 
                  ? `${lifter.personalRecords.find(record => record.lift === filterLift)?.weight || 0} ${lifter.personalRecords.find(record => record.lift === filterLift)?.unit || 'lb'}`
                  : lifter.totalScore
                }
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedLifter && (
        <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ScrollView>
            <Image source={{ uri: selectedLifter.profileImage }} style={styles.modalImage} />
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedLifter.name}, {selectedLifter.age}
              </Text>
              <Text style={[styles.modalSubtitle, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                {selectedLifter.location}
              </Text>
              
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Bio
              </Text>
              <Text style={[styles.bioText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedLifter.bio}
              </Text>
              
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Personal Records
              </Text>
              <View style={styles.prContainer}>
                {selectedLifter.personalRecords.map((record, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.prCard, 
                      { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
                    ]}
                  >
                    <Text style={[styles.prLift, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {record.lift}
                    </Text>
                    <Text style={[styles.prValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      {record.weight} {record.unit}
                    </Text>
                    <Text style={[styles.prDate, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                      {new Date(record.date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Specialties
              </Text>
              <View style={styles.specialtiesGrid}>
                {selectedLifter.specialties.map((specialty, index) => (
                  <View
                    key={index}
                    style={[
                      styles.specialtyTagLarge,
                      { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                    ]}
                  >
                    <Text style={[styles.specialtyText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      {specialty}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.totalScoreContainer}>
                <Text style={[styles.totalScoreLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Total Lifting Score
                </Text>
                <Text style={[styles.totalScoreValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  {selectedLifter.totalScore}
                </Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={closeLifterDetails}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  filterContainer: {
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  rankHeader: {
    width: 50,
    fontWeight: 'bold',
  },
  nameHeader: {
    flex: 1,
    fontWeight: 'bold',
  },
  scoreHeader: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  lifterRow: {
    flexDirection: 'row',
    borderRadius: 12,
    margin: 8,
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontWeight: 'bold',
    color: 'white',
  },
  lifterInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lifterImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  lifterName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lifterLocation: {
    fontSize: 14,
    marginBottom: 6,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
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
    height: 250,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  prContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 10,
  },
  prCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  prLift: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prDate: {
    fontSize: 12,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  specialtyTagLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  totalScoreContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  totalScoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totalScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalButtons: {
    padding: 16,
  },
  closeButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 