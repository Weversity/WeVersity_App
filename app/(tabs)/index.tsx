import ShortsFeed from '@/src/components/shorts/ShortsFeed';
import StatefulPage from '@/src/components/common/StatefulPage';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ShortsScreen() {
    return (
        <StatefulPage>
            <View style={styles.container}>
                <ShortsFeed />
            </View>
        </StatefulPage>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});
