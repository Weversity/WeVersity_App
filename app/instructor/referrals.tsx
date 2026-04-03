import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '@/src/auth/supabase';
import { useAuth } from '@/src/context/AuthContext';

const { width } = Dimensions.get('window');

const ReferralsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    conversionRate: 0,
  });

  const fetchReferralData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // 1. Fetch Referral Code from Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setReferralCode(profileData?.referral_code || '');

      // 2. Fetch Stats from Referrals Table
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('reward_amount, status')
        .eq('referrer_id', user.id);

      if (referralsError) throw referralsError;

      if (referralsData) {
        const total = referralsData.length;
        const earnings = referralsData.reduce((acc, curr) => acc + (curr.reward_amount || 0), 0);
        const completed = referralsData.filter(r => r.status === 'completed').length;
        const conversion = total > 0 ? (completed / total) * 100 : 0;

        setStats({
          totalReferrals: total,
          totalEarnings: earnings,
          conversionRate: parseFloat(conversion.toFixed(1)),
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      Alert.alert('Error', 'Failed to load referral statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReferralData();
  };

  const handleCopy = (link: string) => {
    Clipboard.setString(link);
    Alert.alert('Copied', 'Referral link copied to clipboard!');
  };

  const handleShare = async (link: string, type: string) => {
    try {
      const message = type === 'Instructor' 
        ? `Join the professional instructor community at WeVersity! Use my referral link to sign up and we both get a 1000 WeCoins bonus. Let's grow together! ${link}`
        : `Unlock your potential with WeVersity! Use my referral link to sign up as a student and we both get a 1000 WeCoins bonus. Let's start learning together! ${link}`;
        
      await Share.share({
        message,
        url: link, // iOS only
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const studentLink = `https://weversity.org/student-registration?ref=${referralCode}`;
  const instructorLink = `https://weversity.org/instructor-registration?ref=${referralCode}`;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referrals</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8A2BE2']} />
        }
      >
        {/* Top Banner */}
        <LinearGradient colors={['#8A2BE2', '#9D50E5']} style={styles.bannerCard}>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>Invite Friends & Earn</Text>
            <Text style={styles.bannerReward}>1,000 WeCoins</Text>
            <Text style={styles.bannerSubtitle}>Earn rewards for every friend who joins WeVersity using your link.</Text>
          </View>
          <Ionicons name="gift-outline" size={80} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#F0E6FF' }]}>
              <Ionicons name="people-outline" size={22} color="#8A2BE2" />
            </View>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFF9E6' }]}>
              <Ionicons name="wallet-outline" size={22} color="#FFD700" />
            </View>
            <Text style={styles.statValue}>{stats.totalEarnings.toLocaleString()} WC</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E6FFFA' }]}>
              <Ionicons name="stats-chart-outline" size={22} color="#00C853" />
            </View>
            <Text style={styles.statValue}>{stats.conversionRate}%</Text>
            <Text style={styles.statLabel}>Conversion</Text>
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Links</Text>
          
          {/* Student Link */}
          <View style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <Ionicons name="school-outline" size={20} color="#8A2BE2" />
              <Text style={styles.linkHeaderText}>Student Registration</Text>
            </View>
            <Text style={styles.linkUrl} numberOfLines={1}>{studentLink}</Text>
            <View style={styles.linkActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleCopy(studentLink)}>
                <Ionicons name="copy-outline" size={18} color="#8A2BE2" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.shareBtn]} onPress={() => handleShare(studentLink, 'Student')}>
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructor Link */}
          <View style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <Ionicons name="person-outline" size={20} color="#8A2BE2" />
              <Text style={styles.linkHeaderText}>Instructor Registration</Text>
            </View>
            <Text style={styles.linkUrl} numberOfLines={1}>{instructorLink}</Text>
            <View style={styles.linkActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleCopy(instructorLink)}>
                <Ionicons name="copy-outline" size={18} color="#8A2BE2" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.shareBtn]} onPress={() => handleShare(instructorLink, 'Instructor')}>
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#8A2BE2" />
          <Text style={styles.infoText}>
            Invite your friends! You both will receive 1,000 WeCoins once they successfully complete their registration.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReferralsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#8A2BE2',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bannerCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerInfo: {
    flex: 1,
    zIndex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  bannerReward: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
    marginVertical: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginTop: 4,
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 60) / 3,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 10,
  },
  linkUrl: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#F8F9FE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8A2BE2',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  shareBtn: {
    backgroundColor: '#8A2BE2',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F4EBFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6d28d9',
    lineHeight: 18,
  },
});
