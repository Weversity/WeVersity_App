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
    TextInput,
    Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useState } from 'react';

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

    // Form State
    const [amount, setAmount] = useState('0.00');
    const [bankName, setBankName] = useState('');
    const [accountTitle, setAccountTitle] = useState('');
    const [iban, setIban] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived Data
    const availableWC = 35; // Dummy for now
    const estValue = (availableWC / 1000).toFixed(2);
    const minWithdrawal = 20.00;

    const handleRequestFunds = () => {
        const floatAmount = parseFloat(amount);
        
        if (!bankName || !accountTitle || !iban) {
            Alert.alert("Error", "Please fill in all bank details.");
            return;
        }

        if (isNaN(floatAmount) || floatAmount < minWithdrawal) {
            Alert.alert("Minimum Limit", `The minimum withdrawal amount is $${minWithdrawal.toFixed(2)}.`);
            return;
        }

        if (floatAmount > parseFloat(estValue)) {
            Alert.alert("Insufficient Balance", "You don't have enough WeCoins for this amount.");
            return;
        }

        setIsSubmitting(true);
        // Backend integration will follow once confirmation is received
        setTimeout(() => {
            Alert.alert("Success", "Withdrawal request submitted successfully!");
            setIsSubmitting(false);
        }, 1500);
    };

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
                
                {/* Available Balance Header */}
                <View style={styles.balanceHeader}>
                    <View style={styles.balanceGroup}>
                        <Text style={styles.balLabel}>AVAILABLE BALANCE</Text>
                        <Text style={styles.balWC}>{availableWC} WC</Text>
                    </View>
                    <View style={styles.balanceGroupRight}>
                        <Text style={[styles.balLabel, { textAlign: 'right' }]}>EST. VALUE</Text>
                        <Text style={styles.balUSD}>${estValue}</Text>
                    </View>
                </View>

                {/* Important Policy Note */}
                <View style={styles.policyBox}>
                    <View style={styles.policyIconBox}>
                        <Ionicons name="information-circle" size={18} color="#2196F3" />
                    </View>
                    <Text style={styles.policyText}>
                        Important: Balance must be withdrawn within 1 year of earning. Unclaimed balance after 1 year will be donated to the organization's educational fund. 
                        <Text style={{ fontWeight: 'bold' }}> Minimum withdrawal is $20.00.</Text>
                    </Text>
                </View>

                <View style={styles.mainGrid}>
                    {/* New Withdrawal Request Form */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.titleIconBg, { backgroundColor: '#F3E5F5' }]}>
                                <Ionicons name="cash-outline" size={18} color="#8A2BE2" />
                            </View>
                            <Text style={styles.sectionTitle}>New Withdrawal Request</Text>
                        </View>

                        <Text style={styles.inputLabel}>AMOUNT (USD)</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencyPrefix}>$</Text>
                            <TextInput 
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <Text style={styles.bankSectionTitle}>BANK DETAILS</Text>
                        <View style={styles.bankFieldsGrid}>
                            <View style={styles.bankFieldWrapper}>
                                <Text style={styles.inputLabel}>BANK NAME</Text>
                                <TextInput 
                                    style={styles.bankInput}
                                    placeholder="e.g. HBL, Meczan Bank"
                                    value={bankName}
                                    onChangeText={setBankName}
                                />
                            </View>
                            <View style={styles.bankFieldWrapper}>
                                <Text style={styles.inputLabel}>ACCOUNT TITLE</Text>
                                <TextInput 
                                    style={styles.bankInput}
                                    placeholder="Full Name on Account"
                                    value={accountTitle}
                                    onChangeText={setAccountTitle}
                                />
                            </View>
                        </View>

                        <Text style={styles.inputLabel}>IBAN / ACCOUNT NUMBER</Text>
                        <TextInput 
                            style={styles.bankInput}
                            placeholder="PK00 XXXX XXXX XXXX XXXX"
                            value={iban}
                            onChangeText={setIban}
                        />

                        <TouchableOpacity 
                            style={styles.requestBtn} 
                            onPress={handleRequestFunds}
                            disabled={isSubmitting}
                        >
                            <LinearGradient
                                colors={['#8A2BE2', '#4B0082']}
                                style={styles.gradientBtn}
                            >
                                <Text style={styles.requestBtnText}>
                                    {isSubmitting ? "Processing..." : "Process Request"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Withdrawal History */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.titleIconBg, { backgroundColor: '#E1F5FE' }]}>
                                <Ionicons name="time-outline" size={18} color="#03A9F4" />
                            </View>
                            <Text style={styles.sectionTitle}>Withdrawal History</Text>
                        </View>

                        {dummyHistory.length > 0 ? (
                            dummyHistory.map(item => (
                                <View key={item.id} style={styles.historyItem}>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.histAmt}>${item.amount}</Text>
                                        <Text style={styles.histDate}>{item.date} • {item.method}</Text>
                                    </View>
                                    {renderStatusBadge(item.status)}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyHistory}>
                                <Ionicons name="receipt-outline" size={40} color="#eee" />
                                <Text style={styles.emptyText}>No withdrawal requests yet</Text>
                            </View>
                        )}
                    </View>
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
    // Glassmorphism & New Layout Styles
    balanceHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: '#fff', borderRadius: 24, padding: 22,
        marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 15,
        elevation: 2,
    },
    balanceGroup: { flex: 1 },
    balanceGroupRight: { flex: 1 },
    balLabel: { fontSize: 10, fontWeight: '700', color: '#bbb', letterSpacing: 1 },
    balWC: { fontSize: 20, fontWeight: 'bold', color: '#8A2BE2', marginTop: 4 },
    balUSD: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50', marginTop: 4 },

    policyBox: {
        flexDirection: 'row', backgroundColor: '#E3F2FD',
        borderRadius: 20, padding: 18, marginBottom: 25,
        borderWidth: 1, borderColor: '#BBDEFB',
    },
    policyIconBox: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    policyText: { flex: 1, fontSize: 12, color: '#1976D2', lineHeight: 18 },

    mainGrid: { gap: 20, paddingBottom: 40 },
    sectionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 28, padding: 24,
        borderWidth: 1, borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        elevation: 3,
    },
    titleIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1C3D' },

    inputLabel: { fontSize: 10, fontWeight: '800', color: '#999', marginBottom: 10, letterSpacing: 0.5 },
    amountInputContainer: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: '#F8F9FA', borderRadius: 16, paddingHorizontal: 16, 
        height: 56, marginBottom: 25, borderWidth: 1, borderColor: '#eee' 
    },
    currencyPrefix: { fontSize: 18, fontWeight: 'bold', color: '#333', marginRight: 8 },
    amountInput: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#1A1C3D' },

    bankSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#333', marginVertical: 20, textTransform: 'uppercase' },
    bankFieldsGrid: { gap: 20, marginBottom: 20 },
    bankFieldWrapper: { flex: 1 },
    bankInput: {
        backgroundColor: '#F8F9FA', borderRadius: 16, 
        paddingHorizontal: 16, height: 52, fontSize: 14, 
        color: '#333', marginBottom: 10, borderWidth: 1, borderColor: '#eee'
    },

    requestBtn: { marginTop: 10, borderRadius: 18, overflow: 'hidden' },
    gradientBtn: { height: 56, justifyContent: 'center', alignItems: 'center' },
    requestBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    historyItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f9f9f9',
    },
    historyInfo: { flex: 1 },
    histAmt: { fontSize: 16, fontWeight: 'bold', color: '#1A1C3D', marginBottom: 4 },
    histDate: { fontSize: 12, color: '#999' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: 'bold' },

    emptyHistory: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: '#bbb', fontSize: 13, marginTop: 15 },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
});

export default WithdrawalsScreen;
