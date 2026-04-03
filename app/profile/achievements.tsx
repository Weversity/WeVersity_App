import { coinService } from '@/src/services/coinService';
import { useAuth } from '@/src/context/AuthContext';
import { CoinTransaction } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WeCoinIcon from '@/src/components/common/WeCoinIcon';

const { width } = Dimensions.get('window');

const AchievementScreen = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        if (!user?.id) return;
        try {
            const [b, tx] = await Promise.all([
                coinService.getBalance(user.id),
                coinService.getTransactions(user.id)
            ]);
            setBalance(b);
            setTransactions(tx);
        } catch (error) {
            console.error('[Achievements] Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (user?.id) {
            const unsubscribe = coinService.subscribeToBalanceChanges(user.id, (newBalance) => {
                setBalance(newBalance);
            });
            return unsubscribe;
        }
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const upcomingMilestones = [
        { id: '1', title: 'Course Master', progress: 0.8, reward: 300, icon: 'school' },
        { id: '2', title: 'Top Student', progress: 0.4, reward: 500, icon: 'medal' },
    ];

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Achievements</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8A2BE2']} />}
            >
                {/* Points Card */}
                <LinearGradient
                    colors={['#8A2BE2', '#9D50E5']}
                    style={styles.pointsCard}
                >
                    <View style={styles.pointsInfo}>
                        <Text style={styles.pointsLabel}>Available WeCoins</Text>
                        <View style={styles.pointsValueRow}>
                            <WeCoinIcon size={24} style={{marginRight: 8}} />
                            <Text style={styles.pointsValue}>{balance.toLocaleString()}</Text>
                        </View>
                        <Text style={styles.approxValue}>≈ ${(balance / 100).toFixed(2)} Student Credits</Text>
                    </View>
                    <View style={styles.streakInfo}>
                        <View style={styles.streakCircle}>
                            <Ionicons name="flash" size={24} color="#fff" />
                            <Text style={styles.streakText}>3</Text>
                        </View>
                        <Text style={styles.streakLabel}>Day Streak</Text>
                    </View>
                </LinearGradient>

                {/* Milestones */}
                <View style={[styles.sectionHeader, {marginTop: 20}]}>
                    <Text style={styles.sectionTitle}>Upcoming Milestones</Text>
                </View>

                {upcomingMilestones.map(mile => (
                    <View key={mile.id} style={styles.milestoneCard}>
                        <View style={styles.milestoneIcon}>
                            <Ionicons name={mile.icon as any} size={24} color="#8A2BE2" />
                        </View>
                        <View style={styles.milestoneInfo}>
                            <View style={styles.mileRow}>
                                <Text style={styles.mileTitle}>{mile.title}</Text>
                                <Text style={styles.mileReward}>+{mile.reward} WC</Text>
                            </View>
                            <View style={styles.progressContainer}>
                                <View style={[styles.progressBar, { width: `${mile.progress * 100}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{Math.round(mile.progress * 100)}% complete</Text>
                        </View>
                    </View>
                ))}

                {/* History / Ledger */}
                <View style={[styles.sectionHeader, {marginTop: 20}]}>
                    <Text style={styles.sectionTitle}>History</Text>
                </View>

                {transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <View key={tx.id} style={styles.transactionItem}>
                            <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                                <Ionicons 
                                    name={tx.amount > 0 ? "arrow-up" : "arrow-down"} 
                                    size={18} 
                                    color={tx.amount > 0 ? "#4CAF50" : "#F44336"} 
                                />
                            </View>
                            <View style={styles.txInfo}>
                                <Text style={styles.txDesc}>{tx.description}</Text>
                                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                            </View>
                            <Text style={[styles.txAmount, { color: tx.amount > 0 ? "#4CAF50" : "#F44336" }]}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No coin activity yet</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        padding: 20,
    },
    pointsCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pointsInfo: {
        flex: 1,
    },
    pointsLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    pointsValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointsValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    approxValue: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    streakInfo: {
        alignItems: 'center',
    },
    streakCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    streakText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: -2,
    },
    streakLabel: {
        fontSize: 10,
        color: '#fff',
        marginTop: 6,
        fontWeight: '600',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    milestoneCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    milestoneIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3E5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    milestoneInfo: {
        flex: 1,
        marginLeft: 16,
    },
    mileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    mileTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    mileReward: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#8A2BE2',
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        marginBottom: 6,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#8A2BE2',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        color: '#999',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    txIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    txInfo: {
        flex: 1,
        marginLeft: 12,
    },
    txDesc: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    txDate: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    txAmount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
    }
});

export default AchievementScreen;
