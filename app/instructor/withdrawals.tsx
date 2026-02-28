import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Dummy Data
const dummyEarnings = {
    totalBalance: "1,250.00",
    pendingApproval: "450.00",
    lifetimeEarnings: "15,800.00"
};

const dummyPayoutMethods = [
    {
        id: '1',
        type: 'Bank',
        bankName: 'Allied Bank Limited (ABL)',
        accountHolder: 'Sameer Khan',
        accountNumber: '**** **** **** 1234',
        isDefault: true
    },
    {
        id: '2',
        type: 'Easypaisa',
        accountHolder: 'Sameer Khan',
        accountNumber: '0300 1234567',
        isDefault: false
    }
];

const dummyHistory = [
    { id: '1', amount: '500.00', date: '20 Feb 2026', status: 'Completed', method: 'Bank Transfer' },
    { id: '2', amount: '250.00', date: '15 Feb 2026', status: 'Pending', method: 'Easypaisa' },
    { id: '3', amount: '1000.00', date: '30 Jan 2026', status: 'Rejected', method: 'Bank Transfer' },
    { id: '4', amount: '150.00', date: '10 Jan 2026', status: 'Completed', method: 'JazzCash' },
];

const WithdrawalsScreen = () => {
    const router = useRouter();

    const renderStatusBadge = (status: string) => {
        let backgroundColor = '#E8F5E9';
        let textColor = '#2E7D32';

        if (status === 'Pending') {
            backgroundColor = '#FFF3E0';
            textColor = '#EF6C00';
        } else if (status === 'Rejected') {
            backgroundColor = '#FFEBEE';
            textColor = '#C62828';
        }

        return (
            <View style={[styles.statusBadge, { backgroundColor }]}>
                <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Withdrawals</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Payout Policy Note */}
                <View style={styles.policyNote}>
                    <Ionicons name="information-circle" size={20} color="#8A2BE2" />
                    <Text style={styles.policyText}>
                        Minimum withdrawal amount is $10. Withdrawals are processed within 3-5 business days.
                    </Text>
                </View>

                {/* Earnings Cards */}
                <View style={styles.cardsContainer}>
                    <LinearGradient colors={['#8A2BE2', '#9D50E5']} style={styles.mainCard}>
                        <Text style={styles.cardLabelWhite}>Total Balance</Text>
                        <Text style={styles.cardValueWhite}>
                            {dummyEarnings.totalBalance === "0.00" || dummyEarnings.totalBalance === "0" ? 'No Earnings' : `$${dummyEarnings.totalBalance}`}
                        </Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardSublabelWhite}>Ready to withdraw</Text>
                            <Ionicons name="wallet-outline" size={24} color="rgba(255,255,255,0.6)" />
                        </View>
                    </LinearGradient>

                    <View style={styles.row}>
                        <View style={styles.smallCard}>
                            <View style={styles.smallCardIconBg}>
                                <Ionicons name="time-outline" size={20} color="#8A2BE2" />
                            </View>
                            <Text style={styles.cardLabel}>Pending</Text>
                            <Text style={styles.cardValue}>
                                {dummyEarnings.pendingApproval === "0.00" || dummyEarnings.pendingApproval === "0" ? 'No Earnings' : `$${dummyEarnings.pendingApproval}`}
                            </Text>
                        </View>
                        <View style={styles.smallCard}>
                            <View style={[styles.smallCardIconBg, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="stats-chart" size={20} color="#2E7D32" />
                            </View>
                            <Text style={styles.cardLabel}>Lifetime</Text>
                            <Text style={styles.cardValue}>
                                {dummyEarnings.lifetimeEarnings === "0.00" || dummyEarnings.lifetimeEarnings === "0" ? 'No Earnings' : `$${dummyEarnings.lifetimeEarnings}`}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Payout Destination */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Payout Destination</Text>
                        <TouchableOpacity style={styles.addMethodBtn}>
                            <Ionicons name="add" size={20} color="#8A2BE2" />
                            <Text style={styles.addMethodText}>Add New</Text>
                        </TouchableOpacity>
                    </View>

                    {dummyPayoutMethods.map(method => (
                        <View key={method.id} style={styles.methodCard}>
                            <View style={styles.methodIconContainer}>
                                <Ionicons
                                    name={method.type === 'Bank' ? 'business' : 'phone-portrait'}
                                    size={24}
                                    color="#8A2BE2"
                                />
                            </View>
                            <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>{method.bankName || method.type}</Text>
                                <Text style={styles.methodAccount}>{method.accountNumber}</Text>
                                <Text style={styles.methodHolder}>{method.accountHolder}</Text>
                            </View>
                            {method.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultText}>Default</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.methodActionBtn}>
                                <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Transfer History */}
                <View style={[styles.section, { marginBottom: 100 }]}>
                    <Text style={styles.sectionTitle}>Transfer History</Text>
                    {dummyHistory.map(item => (
                        <View key={item.id} style={styles.historyItem}>
                            <View style={styles.historyIcon}>
                                <Ionicons
                                    name={item.status === 'Completed' ? 'arrow-up-circle' : 'time-outline'}
                                    size={24}
                                    color={item.status === 'Completed' ? '#4CAF50' : '#8A2BE2'}
                                />
                            </View>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyAmount}>${item.amount}</Text>
                                <Text style={styles.historyDate}>{item.date} • {item.method}</Text>
                            </View>
                            {renderStatusBadge(item.status)}
                        </View>
                    ))}
                </View>

            </ScrollView>

            {/* Request Funds Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.requestBtn} activeOpacity={0.8}>
                    <LinearGradient
                        colors={['#8A2BE2', '#9D50E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBtn}
                    >
                        <Text style={styles.requestBtnText}>Request Funds</Text>
                        <Ionicons name="send" size={18} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
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
    policyNote: {
        flexDirection: 'row',
        backgroundColor: '#F3E5F5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 25,
    },
    policyText: {
        flex: 1,
        fontSize: 12,
        color: '#6d28d9',
        marginLeft: 10,
        lineHeight: 18,
    },
    cardsContainer: {
        marginBottom: 30,
    },
    mainCard: {
        borderRadius: 24,
        padding: 25,
        marginBottom: 15,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardLabelWhite: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 5,
    },
    cardValueWhite: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: 15,
    },
    cardSublabelWhite: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    smallCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    smallCardIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3E5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    addMethodBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addMethodText: {
        color: '#8A2BE2',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    methodIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#F7F0FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    methodAccount: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    methodHolder: {
        fontSize: 11,
        color: '#999',
    },
    defaultBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 10,
    },
    defaultText: {
        color: '#2E7D32',
        fontSize: 10,
        fontWeight: 'bold',
    },
    methodActionBtn: {
        padding: 5,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    historyInfo: {
        flex: 1,
    },
    historyAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 12,
        color: '#999',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    requestBtn: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
    },
    gradientBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    requestBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WithdrawalsScreen;
