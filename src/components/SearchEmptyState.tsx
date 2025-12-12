import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface SearchEmptyStateProps {
    query: string;
}

const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ query }) => {
    return (
        <View style={styles.container}>
            {/* Top Header Row */}
            <View style={styles.headerRow}>
                <Text style={styles.resultsText}>
                    Results for <Text style={styles.highlightText}>"{query}"</Text>
                </Text>
                <Text style={styles.countText}>0 found</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Image
                    source={require('../../assets/images/notfound.jpg')}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Not Found</Text>
                <Text style={styles.description}>
                    Sorry, the keyword you entered cannot be found, please check again or search with another keyword.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    resultsText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
    highlightText: {
        color: '#8A2BE2',
    },
    countText: {
        fontSize: 14,
        color: '#8A2BE2',
        fontWeight: '500',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    image: {
        width: 250,
        height: 250,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default SearchEmptyState;
