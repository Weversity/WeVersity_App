import { storage } from '@/src/components/chat/storage';
import SupportChat from '@/src/components/SupportChat';
import SupportForm from '@/src/components/SupportForm';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const [formVisible, setFormVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasPreviousChat, setHasPreviousChat] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkExistingChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const conversations = await storage.loadConversations(user.id);
          if (conversations && conversations.length > 0) {
            setHasPreviousChat(true);
            setInitialEmail(conversations[0].email);
          }
        }
      } catch (error) {
        console.error('Error checking existing chat:', error);
      } finally {
        setLoading(false);
        if (params.chat === 'true') {
          setChatVisible(true);
        }
      }
    };

    checkExistingChat();
  }, [params]);

  const handleContactPress = () => {
    if (hasPreviousChat) {
      setChatVisible(true);
    } else {
      setFormVisible(true);
    }
  };

  const handleStartChat = async (email: string, message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to start a chat.');
        return;
      }

      setLoading(true);
      // Create a new conversation in SQL
      const newConv = await storage.createNewConversation(user.id, email, message.substring(0, 30));
      if (newConv) {
        // Save the first message
        await storage.saveMessage(newConv.id, message, 'user');

        setInitialEmail(email);
        setInitialMessage(''); // Message already saved
        setHasPreviousChat(true);
        setFormVisible(false);

        // Short delay for UI smoothness
        setTimeout(() => {
          setChatVisible(true);
          setLoading(false);
        }, 500);
      } else {
        setLoading(false);
        alert('Failed to start chat. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error starting chat:', error);
    }
  };

  const handleClose = () => {
    if (params.chat === 'true') {
      router.back();
    } else {
      setChatVisible(false);
    }
  };

  if (loading && !chatVisible && !formVisible) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

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
          <TouchableOpacity style={styles.button} onPress={handleContactPress}>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
