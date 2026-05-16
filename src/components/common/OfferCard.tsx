import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function OfferCard({ route }: { route: string }) {
    const router = useRouter();
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -8, // Move up
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0, // Move down
                    duration: 1200,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);
    
    return (
        <TouchableOpacity style={styles.cardContainer} onPress={() => router.push(route as any)} activeOpacity={0.9}>
            <LinearGradient
                colors={['#7613C3', '#49108B']} // Deep vivid purple
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
            >
                {/* Background Bubbles for depth */}
                <View style={styles.bubbleTopRight} />
                <View style={styles.bubbleBottomLeft} />
                <View style={styles.bubbleMiddle} />

                <View style={styles.contentContainer}>
                    {/* Top Badges Row */}
                    <View style={styles.topRow}>
                        <View style={styles.specialOfferBadge}>
                            <Text style={styles.specialOfferText}>SPECIAL OFFER</Text>
                        </View>
                        <View style={styles.inviteEarnBadge}>
                            <Ionicons name="gift" size={12} color="#FFD700" style={{ marginRight: 4 }} />
                            <Text style={styles.inviteEarnText}>INVITE & EARN</Text>
                        </View>
                    </View>

                    {/* Text content wrapped to prevent overlap with right image */}
                    <View style={styles.textWrapper}>
                        <View style={styles.titleRow}>
                            <Text style={styles.mainAmount}>1,000</Text>
                            <Text style={styles.currencyText}> WeCoins</Text>
                        </View>

                        <Text style={styles.subtitle}>
                            Earn rewards for every friend who joins WeVersity.
                        </Text>

                        <View style={styles.inviteButton}>
                            <Text style={styles.inviteButtonText}>Invite Friends</Text>
                            <Ionicons name="arrow-forward" size={16} color="#7613C3" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </View>

                {/* Right Image Section */}
                <View style={styles.imageSection}>
                    <View style={styles.imageWrapper}>
                        <Image 
                            source={require('../../../assets/images/referral_reward_icon.png')} 
                            style={styles.rewardImage}
                            resizeMode="cover"
                        />
                    </View>
                    <Animated.View style={[styles.starIcon, { transform: [{ translateY: floatAnim }, { rotate: '15deg' }] }]}>
                        <Ionicons name="star" size={20} color="#FFD700" />
                    </Animated.View>
                </View>

            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: 0,
        marginBottom: 30,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    gradientCard: {
        borderRadius: 20,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    bubbleTopRight: {
        position: 'absolute',
        top: -40,
        right: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    bubbleBottomLeft: {
        position: 'absolute',
        bottom: -50,
        left: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    bubbleMiddle: {
        position: 'absolute',
        bottom: 20,
        right: 80,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    contentContainer: {
        width: '100%',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    specialOfferBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    specialOfferText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    inviteEarnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    inviteEarnText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    textWrapper: {
        width: '65%', // Prevents text from going under the image
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    mainAmount: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
    },
    currencyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    subtitle: {
        fontSize: 12,
        color: '#E9D5FF',
        lineHeight: 18,
        marginBottom: 16,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    inviteButtonText: {
        color: '#7613C3',
        fontWeight: 'bold',
        fontSize: 13,
    },
    imageSection: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 85,
        height: 85,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
        overflow: 'hidden',
    },
    rewardImage: {
        width: '100%',
        height: '100%',
    },
    starIcon: {
        position: 'absolute',
        right: -12,
        bottom: 12,
    }
});
