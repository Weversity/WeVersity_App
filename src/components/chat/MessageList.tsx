import React, { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import MessageBubble from './MessageBubble';
import { Message } from './types';

interface MessageListProps {
    messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const renderItem = useCallback(({ item }: { item: Message }) => (
        <MessageBubble message={item} />
    ), []);

    const keyExtractor = useCallback((item: Message) => item.id, []);

    return (
        <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
            }}
            removeClippedSubviews={true}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={10}
        />
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        paddingVertical: 16,
    },
});

export default React.memo(MessageList);
