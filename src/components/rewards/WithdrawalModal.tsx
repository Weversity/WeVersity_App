import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
    runOnJS,
    interpolate,
    FadeInDown,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_TRANSLATE_Y = -SCREEN_HEIGHT * 0.92;
const DEFAULT_OPEN_Y = -SCREEN_HEIGHT * 0.88;

interface Props {
    visible: boolean;
    onDismiss: () => void;
    onSubmit: (data: { amount: number; bankName: string; accountTitle: string; iban: string }) => Promise<void>;
    balance: number;
    isProcessing: boolean;
}

const WithdrawalModal: React.FC<Props> = ({ visible, onDismiss, onSubmit, balance, isProcessing }) => {
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });

    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountTitle, setAccountTitle] = useState('');
    const [iban, setIban] = useState('');

    const usdValue = (balance / 1000).toFixed(2);

    const scrollTo = (destination: number) => {
        'worklet';
        translateY.value = withSpring(destination, { 
            damping: 50,
            stiffness: 100,
            mass: 0.5,
        });
    };

    useEffect(() => {
        if (visible) {
            scrollTo(DEFAULT_OPEN_Y);
        } else {
            scrollTo(0);
            // Reset fields on close
            setAmount('');
            setBankName('');
            setAccountTitle('');
            setIban('');
        }
    }, [visible]);

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            translateY.value = event.translationY + context.value.y;
            translateY.value = Math.max(translateY.value, MIN_TRANSLATE_Y);
        })
        .onEnd((event) => {
            if (translateY.value > -SCREEN_HEIGHT * 0.4 || event.velocityY > 500) {
                runOnJS(onDismiss)();
            } else {
                scrollTo(DEFAULT_OPEN_Y);
            }
        });

    const rBottomSheetStyle = useAnimatedStyle(() => {
        const borderRadius = interpolate(
            translateY.value,
            [MIN_TRANSLATE_Y, -SCREEN_HEIGHT * 0.5],
            [24, 40],
            'clamp'
        );

        return {
            borderRadius,
            transform: [{ translateY: translateY.value }],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(visible ? 1 : 0),
        };
    }, [visible]);

    const handleConfirm = async () => {
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount < 20000) {
            return;
        }
        if (!bankName || !accountTitle || !iban) {
            alert("Please fill all bank details");
            return;
        }
        await onSubmit({ amount: numAmount, bankName, accountTitle, iban });
    };

    if (!visible && translateY.value === 0) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={StyleSheet.absoluteFill} 
                    onPress={onDismiss} 
                />
            </Animated.View>

            <Animated.View style={[styles.bottomSheetContainer, rBottomSheetStyle]}>
                <GestureDetector gesture={gesture}>
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.line} />
                    </View>
                </GestureDetector>
                
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        style={styles.scrollView} 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={true}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View entering={FadeInDown.delay(200)}>
                            <View style={styles.headerRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.title}>Withdraw Funds</Text>
                                    <View style={styles.minLimitBadge}>
                                        <Ionicons name="information-circle-outline" size={12} color="#FFB300" />
                                        <Text style={styles.minLimitText}>Min. Limit: $20 (20,000 WC)</Text>
                                    </View>
                                </View>
                                <View style={styles.balanceBox}>
                                    <Text style={styles.balanceLabel}>Available Balance</Text>
                                    <Text style={styles.balanceWC}>{balance.toLocaleString()} WC</Text>
                                    <Text style={styles.balanceUSD}>Est. Value: ${usdValue}</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <View style={styles.divider} />

                        {/* Amount Input */}
                        <Text style={styles.inputLabel}>Amount to Withdraw (WC)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter amount in WC..."
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                        
                        {amount ? (
                            Number(amount) < 20000 ? (
                                <View style={styles.warningBox}>
                                    <Ionicons name="warning-outline" size={14} color="#F44336" />
                                    <Text style={styles.warningText}>
                                        Minimum amount is 20,000 WC ($20)
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.successBox}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color="#4CAF50" />
                                    <Text style={styles.successText}>
                                        Will deduct: <Text style={{fontWeight: '900'}}>{Number(amount).toLocaleString()}</Text> WeCoins
                                    </Text>
                                </View>
                            )
                        ) : null}

                        {/* Bank Details */}
                        <Text style={styles.inputLabel}>Bank Name</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Chase Bank"
                                placeholderTextColor="#666"
                                value={bankName}
                                onChangeText={setBankName}
                            />
                        </View>

                        <Text style={styles.inputLabel}>Account Title</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. John Doe"
                                placeholderTextColor="#666"
                                value={accountTitle}
                                onChangeText={setAccountTitle}
                            />
                        </View>

                        <Text style={styles.inputLabel}>IBAN / Account Number</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter IBAN..."
                                placeholderTextColor="#666"
                                value={iban}
                                onChangeText={setIban}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitButton, (isProcessing || Number(amount) < 20000) && { opacity: 0.6 }]} 
                            onPress={handleConfirm}
                            disabled={isProcessing || Number(amount) < 20000}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="cash-outline" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>Confirm Withdrawal</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    bottomSheetContainer: {
        height: SCREEN_HEIGHT,
        width: '100%',
        backgroundColor: '#1A1C3D',
        position: 'absolute',
        top: SCREEN_HEIGHT,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    dragHandleContainer: {
        paddingVertical: 20,
        width: '100%',
        alignItems: 'center',
    },
    line: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // Extra padding for keyboard
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#fff',
    },
    minLimitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,179,0,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        marginTop: 6,
        alignSelf: 'flex-start',
        gap: 4,
    },
    minLimitText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFB300',
    },
    balanceBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'flex-end',
    },
    balanceLabel: {
        fontSize: 9,
        color: '#8A2BE2',
        fontWeight: 'bold',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    balanceWC: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
    },
    balanceUSD: {
        fontSize: 11,
        color: '#aaa',
        marginTop: 2,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: 20,
    },
    inputLabel: {
        fontSize: 13,
        color: '#bbb',
        marginBottom: 8,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputContainer: {
        backgroundColor: '#2D2F45',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    textInput: {
        color: '#fff',
        padding: 16,
        fontSize: 16,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -4,
        marginBottom: 16,
        marginLeft: 4,
    },
    warningText: {
        fontSize: 12,
        color: '#F44336',
        fontWeight: '600',
    },
    successBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -4,
        marginBottom: 16,
        marginLeft: 4,
    },
    successText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#8A2BE2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 18,
        gap: 10,
        marginTop: 10,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default WithdrawalModal;
