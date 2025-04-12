import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, Image, TouchableOpacity, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface Partner {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  availability: string[];
  profileImage: string;
}

export default function PartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const colorScheme = useColorScheme();

  // Mock partners data
  useEffect(() => {
    const mockPartners: Partner[] = [
      {
        id: '1',
        name: 'Alex Wilson',
        age: 28,
        location: 'Downtown',
        bio: 'Fitness enthusiast focused on strength training. Looking for a spotter for heavy lifting days.',
        interests: ['Weightlifting', 'CrossFit', 'Nutrition'],
        availability: ['Weekdays evenings', 'Saturday mornings'],
        profileImage: 'https://images.unsplash.com/photo-1583468982228-19f19164aee2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      },
      {
        id: '2',
        name: 'Jamie Chen',
        age: 32,
        location: 'Midtown',
        bio: 'Marathon runner looking for running buddies. Also interested in HIIT and yoga.',
        interests: ['Running', 'HIIT', 'Yoga'],
        availability: ['Mornings', 'Weekends'],
        profileImage: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      },
      {
        id: '3',
        name: 'Taylor Morgan',
        age: 25,
        location: 'Uptown',
        bio: 'Bodybuilding competitor looking for a training partner for my next competition prep.',
        interests: ['Bodybuilding', 'Powerlifting', 'Diet planning'],
        availability: ['Weekday afternoons', 'Sunday'],
        profileImage: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      },
      {
        id: '4',
        name: 'Jordan Lee',
        age: 29,
        location: 'Eastside',
        bio: 'New to fitness and looking for a gym buddy to help me stay accountable and learn proper form.',
        interests: ['General fitness', 'Cardio', 'Beginner weightlifting'],
        availability: ['Evenings', 'Weekends'],
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      },
      {
        id: '5',
        name: 'Casey Rivera',
        age: 34,
        location: 'Westside',
        bio: 'Certified personal trainer looking for workout partners. Happy to give tips and form corrections.',
        interests: ['Full body workouts', 'Functional fitness', 'Calisthenics'],
        availability: ['Flexible schedule'],
        profileImage: 'https://images.unsplash.com/photo-1517630800677-932d836c22d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
      },
    ];
    
    setPartners(mockPartners);
    setFilteredPartners(mockPartners);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPartners(partners);
    } else {
      const filtered = partners.filter(
        (partner) =>
          partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          partner.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          partner.interests.some(interest => 
            interest.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredPartners(filtered);
    }
  }, [searchQuery, partners]);

  const handlePartnerPress = (partner: Partner) => {
    setSelectedPartner(partner);
  };

  const closePartnerDetails = () => {
    setSelectedPartner(null);
  };

  const openMessageModal = () => {
    setIsMessageModalVisible(true);
  };

  const closeMessageModal = () => {
    setIsMessageModalVisible(false);
    setMessageText('');
  };

  const sendMessage = () => {
    // In a real app, you would send the message to a backend
    // For now, we'll just close the modal and show a success message
    alert(`Message sent to ${selectedPartner?.name}!`);
    closeMessageModal();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Find a Gym Partner
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            placeholder="Search by name, location, or interest..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredPartners.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            style={[
              styles.partnerCard,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}
            onPress={() => handlePartnerPress(partner)}
          >
            <Image source={{ uri: partner.profileImage }} style={styles.partnerImage} />
            <View style={styles.partnerInfo}>
              <Text style={[styles.partnerName, { color: Colors[colorScheme ?? 'light'].text }]}>
                {partner.name}, {partner.age}
              </Text>
              <Text style={[styles.partnerLocation, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                {partner.location}
              </Text>
              <View style={styles.interestsContainer}>
                {partner.interests.slice(0, 2).map((interest, index) => (
                  <View
                    key={index}
                    style={[
                      styles.interestTag,
                      { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                    ]}
                  >
                    <Text style={[styles.interestText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
                {partner.interests.length > 2 && (
                  <View
                    style={[
                      styles.interestTag,
                      { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                    ]}
                  >
                    <Text style={[styles.interestText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      +{partner.interests.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedPartner && (
        <View style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <ScrollView>
            <Image source={{ uri: selectedPartner.profileImage }} style={styles.modalImage} />
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedPartner.name}, {selectedPartner.age}
              </Text>
              <Text style={[styles.modalSubtitle, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                {selectedPartner.location}
              </Text>
              
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Bio
              </Text>
              <Text style={[styles.bioText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {selectedPartner.bio}
              </Text>
              
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Interests
              </Text>
              <View style={styles.interestsGrid}>
                {selectedPartner.interests.map((interest, index) => (
                  <View
                    key={index}
                    style={[
                      styles.interestTagLarge,
                      { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                    ]}
                  >
                    <Text style={[styles.interestText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
              
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Availability
              </Text>
              <View style={styles.availabilityContainer}>
                {selectedPartner.availability.map((time, index) => (
                  <Text 
                    key={index} 
                    style={[styles.availabilityText, { color: Colors[colorScheme ?? 'light'].text }]}
                  >
                    • {time}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: 'transparent', borderColor: Colors[colorScheme ?? 'light'].border, borderWidth: 1 }]}
              onPress={closePartnerDetails}
            >
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.messageButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={openMessageModal}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={isMessageModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.messageModal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <Text style={[styles.messageModalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Send Message to {selectedPartner?.name}
            </Text>
            <TextInput
              style={[
                styles.messageInput,
                { 
                  backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                  color: Colors[colorScheme ?? 'light'].text
                }
              ]}
              multiline
              numberOfLines={4}
              placeholder="Type your message here..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
              value={messageText}
              onChangeText={setMessageText}
            />
            <View style={styles.messageModalButtons}>
              <TouchableOpacity
                style={[
                  styles.messageModalButton,
                  { backgroundColor: 'transparent', borderColor: Colors[colorScheme ?? 'light'].border, borderWidth: 1 }
                ]}
                onPress={closeMessageModal}
              >
                <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.messageModalButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={sendMessage}
                disabled={messageText.trim() === ''}
              >
                <Text style={{ color: 'white' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
  },
  partnerCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  partnerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  partnerLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  interestTagLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '500',
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
    height: 300,
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
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  availabilityContainer: {
    marginBottom: 24,
  },
  availabilityText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
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
  messageButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
    marginLeft: 8,
  },
  messageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageModal: {
    width: '80%',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  messageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  messageModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
}); 