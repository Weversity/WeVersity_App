import { coinService } from '@/src/services/coinService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
    FadeInDown, 
    FadeInRight,
    Layout, 
    SlideInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LeaderboardEntry {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  coins_balance: number;
  occupation?: string;
  role?: string;
}

// ── Components ─────────────────────────────────────────────────────────────

const PodiumItem = ({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => {
  const router = useRouter();
  const isFirst = rank === 1;
  const size = isFirst ? 110 : 85;
  const initials = `${entry.first_name?.[0] || ''}${entry.last_name?.[0] || ''}`.toUpperCase();

  const podiumColors = {
      1: ['#FFD700', '#FFA000'], // Gold
      2: ['#E0E0E0', '#9E9E9E'], // Silver
      3: ['#CD7F32', '#8B4513'], // Bronze
  }[rank as 1|2|3] || ['#fff', '#eee'];

  return (
    <Animated.View 
        entering={FadeInDown.delay(rank * 150).springify()}
        style={[styles.podiumItem, isFirst && styles.podiumFirst]}
    >
      <View style={styles.avatarWrapper}>
        {isFirst && (
            <Animated.View entering={SlideInUp.delay(800)} style={styles.crownContainer}>
                <Ionicons name="ribbon" size={28} color="#FFD700" />
            </Animated.View>
        )}
        
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/viewProfile/[id]', params: { id: entry.id } } as any);
          }}
          style={[styles.podiumAvatarContainer, { borderColor: podiumColors[0] }]}
        >
          {entry.avatar_url ? (
            <Image source={{ uri: entry.avatar_url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
          ) : (
            <View style={[styles.podiumAvatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
              <Text style={[styles.initialsText, { fontSize: size / 2.5 }]}>{initials}</Text>
            </View>
          )}
          
          <LinearGradient colors={podiumColors} style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.podiumTextContainer}>
        <Text style={styles.podiumName} numberOfLines={1}>{entry.first_name} {entry.last_name}</Text>
        <Text style={styles.podiumRole} numberOfLines={1}>{entry.occupation || 'Platform Member'}</Text>
        
        <LinearGradient 
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} 
            style={styles.podiumCoinLabel}
        >
            <Ionicons name="sparkles" size={12} color="#FFD700" />
            <Text style={styles.podiumCoins}>{entry.coins_balance.toLocaleString()}</Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'all_time' | 'weekly'>('all_time');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const results = await coinService.getLeaderboard(period);
      setData(results);
    } catch (error) {
      console.error('[Leaderboard] Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const top3 = useMemo(() => data.slice(0, 3), [data]);
  const others = useMemo(() => data.slice(3), [data]);

  const renderHeader = () => {
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumRoot}>
        <View style={styles.podiumContainer}>
          {top3[1] && <PodiumItem entry={top3[1]} rank={2} />}
          {top3[0] && <PodiumItem entry={top3[0]} rank={1} />}
          {top3[2] && <PodiumItem entry={top3[2]} rank={3} />}
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = index + 4; // Because we slice(3) for 'others'
    const initials = `${item.first_name?.[0] || ''}${item.last_name?.[0] || ''}`.toUpperCase();

    return (
      <Animated.View 
        entering={FadeInRight.delay(index * 50).springify()}
        layout={Layout.springify()}
      >
        <TouchableOpacity 
            style={styles.listItem}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/viewProfile/[id]', params: { id: item.id } } as any)}
        >
            <View style={styles.rankCol}>
                <Text style={styles.listRank}>{rank}</Text>
                <View style={[styles.rankIndicator, rank <= 10 && { backgroundColor: '#8A2BE2' }]} />
            </View>

            <View style={styles.listAvatarContainer}>
            {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.listAvatar} />
            ) : (
                <View style={styles.listAvatarPlaceholder}>
                <Text style={styles.listInitials}>{initials}</Text>
                </View>
            )}
            </View>

            <View style={styles.listInfo}>
                <Text style={styles.listName} numberOfLines={1}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.listRole} numberOfLines={1}>{item.occupation || 'Learner'}</Text>
            </View>

            <LinearGradient 
                colors={['#F5F5F5', '#FAFAFA']} 
                style={styles.listCoinsContainer}
            >
                <Ionicons name="radio-button-on" size={14} color="#FFD700" />
                <Text style={styles.listCoins}>{item.coins_balance.toLocaleString()}</Text>
            </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Modern Purple Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#8A2BE2', '#6A1B9A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Economy Leaders</Text>
            <View style={styles.headerLabelContainer}>
                <View style={styles.liveDot} />
                <Text style={styles.headerSubtitle}>LIVE COMMUNITY RANKINGS</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Period Toggle - Now Outside Header */}
      <View style={styles.toggleOuterWrapper}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, period === 'all_time' && styles.toggleButtonActive]} 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPeriod('all_time');
            }}
          >
            <Text style={[styles.toggleText, period === 'all_time' && styles.toggleTextActive]}>All Time</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, period === 'weekly' && styles.toggleButtonActive]} 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPeriod('weekly');
            }}
          >
            <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>Weekly Highlights</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Analyzing leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={others}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
          }
          ListEmptyComponent={
            <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No rankings found for this period.</Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#8A2BE2',
  },
  headerGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
  },
  liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#4CAF50',
      marginRight: 6,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  toggleOuterWrapper: {
    marginTop: 15,
    marginHorizontal: 20,
    zIndex: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 4,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    boxShadow: '0 4 15 rgba(0,0,0,0.05)',
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleButtonActive: {
    backgroundColor: '#8A2BE2',
  },
  toggleText: {
    color: '#8A2BE2',
    fontWeight: '800',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  loadingText: {
    marginTop: 15,
    color: '#8A2BE2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 60,
  },
  podiumRoot: {
    marginTop: 35,
    marginBottom: 20,
    paddingTop: 10,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  podiumFirst: {
    transform: [{ scale: 1.15 }],
    zIndex: 10,
    marginHorizontal: -5,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  crownContainer: {
    position: 'absolute',
    top: -32,
    zIndex: 11,
    boxShadow: '0 5 15 rgba(255, 215, 0, 0.4)',
  },
  podiumAvatarContainer: {
    borderRadius: 100,
    padding: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8 20 rgba(0,0,0,0.15)',
    elevation: 8,
    borderWidth: 2,
  },
  podiumAvatarPlaceholder: {
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#8A2BE2',
    fontWeight: '900',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    boxShadow: '0 2 8 rgba(0,0,0,0.2)',
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  podiumTextContainer: {
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 16,
      width: '100%',
      marginTop: -10,
      boxShadow: '0 4 12 rgba(0,0,0,0.05)',
      elevation: 2,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A1C3D',
    textAlign: 'center',
  },
  podiumRole: {
    fontSize: 8,
    color: '#bbb',
    textAlign: 'center',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 6,
  },
  podiumCoinLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  podiumCoins: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D4AF37',
  },
  
  // List Styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 22,
    boxShadow: '0 4 12 rgba(0,0,0,0.03)',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F1F7',
  },
  rankCol: {
      width: 35,
      alignItems: 'center',
  },
  listRank: {
    fontSize: 16,
    fontWeight: '900',
    color: '#bbb',
  },
  rankIndicator: {
      width: 4,
      height: 12,
      backgroundColor: '#eee',
      borderRadius: 2,
      marginTop: 4,
  },
  listAvatarContainer: {
    marginHorizontal: 12,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
  },
  listAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInitials: {
    color: '#8A2BE2',
    fontSize: 18,
    fontWeight: '900',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1C3D',
  },
  listRole: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: '600',
    marginTop: 2,
  },
  listCoinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  listCoins: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1C3D',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 20,
    color: '#bbb',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    width: '60%',
  },
});

