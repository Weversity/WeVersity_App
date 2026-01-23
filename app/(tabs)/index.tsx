import ShortsFeed from '@/src/components/shorts/ShortsFeed';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ShortsScreen() {
    return (
        <View style={styles.container}>
            <ShortsFeed />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});
