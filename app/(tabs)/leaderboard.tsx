import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { getUsersWithRecords, UserWithRecords, addPersonalRecord } from '../../services/workoutService';
import { AuthContext } from '../_layout';
import { Button, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';

export default function LeaderboardScreen() {
  const { user } = useContext(AuthContext);
  const [lifters, setLifters] = useState<UserWithRecords[]>([]);
  const [filteredLifters, setFilteredLifters] = useState<UserWithRecords[]>([]);
  const [selectedLifter, setSelectedLifter] = useState<UserWithRecords | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLift, setFilterLift] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const [prDialogVisible, setPrDialogVisible] = useState(false);
  const [newPR, setNewPR] = useState({
    lift: 'Bench Press',
    weight: '',
    unit: 'lb' as 'kg' | 'lb',
    date: new Date().toISOString().split('T')[0]
  });

  const commonLifts = [
    'Bench Press',
    'Squat',
    'Deadlift',
    'Overhead Press',
    'Barbell Row'
  ];

  useEffect(() => {
    fetchUsersWithRecords();
  }, []);

  const fetchUsersWithRecords = async () => {
    try {
      setLoading(true);
      const usersData = await getUsersWithRecords();
      setLifters(usersData);
      setFilteredLifters(usersData);
    } catch (error) {
      console.error('Error fetching users with records:', error);
      Alert.alert('Error', 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let filtered = [...lifters];

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (lifter) =>
          lifter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lifter.location && lifter.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (lifter.specialties && lifter.specialties.some(specialty =>
            specialty.toLowerCase().includes(searchQuery.toLowerCase())
          ))
      );
    }

    if (filterLift) {
      filtered = filtered.sort((a, b) => {
        const aRecord = a.personalRecords.find(record => record.lift === filterLift)?.weight || 0;
        const bRecord = b.personalRecords.find(record => record.lift === filterLift)?.weight || 0;
        return bRecord - aRecord;
      });
    } else {
      filtered = filtered.sort((a, b) => b.totalScore - a.totalScore);
    }

    setFilteredLifters(filtered);
  }, [searchQuery, filterLift, lifters]);

  const handleLifterPress = (lifter: UserWithRecords) => {
    setSelectedLifter(lifter);
  };

  const closeLifterDetails = () => {
    setSelectedLifter(null);
  };

  const handleAddPersonalRecord = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add personal records');
      return;
    }

    if (!newPR.weight || parseFloat(newPR.weight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    try {
      await addPersonalRecord(user.uid, {
        lift: newPR.lift,
        weight: parseFloat(newPR.weight),
        unit: newPR.unit,
        date: newPR.date
      });

      setPrDialogVisible(false);

      setNewPR({
        lift: 'Bench Press',
        weight: '',
        unit: 'lb',
        date: new Date().toISOString().split('T')[0]
      });

      fetchUsersWithRecords();
      Alert.alert('Success', 'Personal record added successfully!');
    } catch (error) {
      console.error('Error adding personal record:', error);
      Alert.alert('Error', 'Failed to add personal record');
    }
  };

  const getBadgeColor = (index: number) => {
    switch (index) {
      case 0: return '#FFD700';
      case 1: return '#C0C0C0';
      case 2: return '#CD7F32';
      default: return Colors[colorScheme ?? 'light'].cardBackground;
    }
  };

  const isCurrentUser = (lifter: UserWithRecords) => user && lifter.id === user.uid;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 12, color: Colors[colorScheme ?? 'light'].text }}>
            Loading leaderboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

      {user && (
        <View style={styles.addRecordContainer}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setPrDialogVisible(true)}
            style={{ borderRadius: 8 }}
          >
            Add Personal Record
          </Button>
        </View>
      )}

      <View style={styles.tableHeader}>
        <Text style={[styles.rankHeader, { color: Colors[colorScheme ?? 'light'].text }]}>Rank</Text>
        <Text style={[styles.nameHeader, { color: Colors[colorScheme ?? 'light'].text }]}>Lifter</Text>
        <Text style={[styles.scoreHeader, { color: Colors[colorScheme ?? 'light'].text }]}>
          {filterLift ? filterLift : 'Total'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredLifters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color={Colors[colorScheme ?? 'light'].mutedText} />
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
              No lifters found
            </Text>
            <Text style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
              {user ? 'Be the first to add a personal record!' : 'Log in to add your personal records!'}
            </Text>
          </View>
        ) : (
          filteredLifters.map((lifter, index) => (
            <TouchableOpacity
              key={lifter.id}
              style={[
                styles.lifterRow,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground },
                isCurrentUser(lifter) && styles.currentUserRow
              ]}
              onPress={() => handleLifterPress(lifter)}
            >
              <View style={[styles.rankBadge, { backgroundColor: getBadgeColor(index) }]}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>

              <View style={styles.lifterInfo}>
                <Image
                  source={{ uri: lifter.profileImage }}
                  style={styles.lifterImage}
                  onError={() => console.log('Error loading image for:', lifter.name)}
                />
                <View>
                  <View style={styles.nameContainer}>
                    <Text style={[styles.lifterName, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {lifter.name}
                    </Text>
                    {isCurrentUser(lifter) && (
                      <View style={styles.currentUserBadge}>
                        <Text style={styles.currentUserText}>You</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.lifterLocation, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                    {lifter.location || 'Unknown location'}
                  </Text>
                  <View style={styles.specialtiesContainer}>
                    {lifter.specialties && lifter.specialties.length > 0 ? (
                      lifter.specialties.slice(0, 2).map((specialty, i) => (
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
                      ))
                    ) : (
                      <View
                        style={[
                          styles.specialtyTag,
                          { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                        ]}
                      >
                        <Text style={[styles.specialtyText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                          Gym Enthusiast
                        </Text>
                      </View>
                    )}
                    {lifter.specialties && lifter.specialties.length > 2 && (
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
          ))
        )}
      </ScrollView>

      {selectedLifter && (
        <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ScrollView>
            <Image source={{ uri: selectedLifter.profileImage }} style={styles.modalImage} />
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedLifter.name} {selectedLifter.age ? `, ${selectedLifter.age}` : ''}
                {isCurrentUser(selectedLifter) && " (You)"}
              </Text>
              <Text style={[styles.modalSubtitle, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                {selectedLifter.location || 'Unknown location'}
              </Text>

              {selectedLifter.bio && (
                <>
                  <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Bio
                  </Text>
                  <Text style={[styles.bioText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedLifter.bio}
                  </Text>
                </>
              )}

              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Personal Records
              </Text>
              {selectedLifter.personalRecords.length === 0 ? (
                <Text style={[styles.emptyRecords, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                  No personal records yet
                </Text>
              ) : (
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
              )}

              {selectedLifter.specialties && selectedLifter.specialties.length > 0 && (
                <>
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
                </>
              )}

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

      <Portal>
        <Dialog
          visible={prDialogVisible}
          onDismiss={() => setPrDialogVisible(false)}
          style={{ backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }}
        >
          <Dialog.Title>Add Personal Record</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Exercise"
              value={newPR.lift}
              onChangeText={(text) => setNewPR({ ...newPR, lift: text })}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.inputRow}>
              <PaperTextInput
                label="Weight"
                value={newPR.weight}
                onChangeText={(text) => setNewPR({ ...newPR, weight: text })}
                keyboardType="numeric"
                style={[styles.input, { flex: 3 }]}
                mode="outlined"
              />

              <View style={{ width: 8 }} />

              <PaperTextInput
                label="Unit"
                value={newPR.unit}
                onChangeText={(text) => setNewPR({ ...newPR, unit: text === 'kg' ? 'kg' : 'lb' })}
                style={[styles.input, { flex: 1 }]}
                mode="outlined"
                right={
                  <PaperTextInput.Icon
                    icon="chevron-down"
                    onPress={() => {
                      setNewPR({ ...newPR, unit: newPR.unit === 'kg' ? 'lb' : 'kg' });
                    }}
                  />
                }
              />
            </View>

            <PaperTextInput
              label="Date"
              value={newPR.date}
              onChangeText={(text) => setNewPR({ ...newPR, date: text })}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPrDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddPersonalRecord} mode="contained">Save</Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  addRecordContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserRow: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserBadge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentUserText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyRecords: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});