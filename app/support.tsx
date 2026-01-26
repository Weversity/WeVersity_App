import SupportChat from '@/src/components/SupportChat';
import SupportForm from '@/src/components/SupportForm';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const [formVisible, setFormVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (params.chat === 'true') {
      setChatVisible(true);
    }
  }, [params]);

  const handleStartChat = (email: string, message: string) => {
    setInitialEmail(email);
    setInitialMessage(message);
    setFormVisible(false);
    // Use a timeout to allow the first modal to close before the second one opens
    setTimeout(() => {
      setChatVisible(true);
    }, 500);
  };

  const handleClose = () => {
    if (params.chat === 'true') {
      router.back();
    } else {
      setChatVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Support</Text>
        <View style={{ width: 24 }} />
      </View>
      <SafeAreaView style={styles.contentArea}>
        <View style={styles.content}>
          <Ionicons name="headset-outline" size={80} color="#8A2BE2" />
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>Our support team is here for you 24/7.</Text>
          <TouchableOpacity style={styles.button} onPress={() => setFormVisible(true)}>
            <Text style={styles.buttonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SupportForm
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onStartChat={handleStartChat}
      />

      <SupportChat
        visible={chatVisible}
        onClose={handleClose}
        initialEmail={initialEmail}
        initialMessage={initialMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F8',
  },
  header: {
    flexDirection: 'row',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
