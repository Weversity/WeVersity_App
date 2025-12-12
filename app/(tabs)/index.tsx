import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveCourses from '@/src/components/LiveCourses';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Live Courses</Text>
      </View>
      <SafeAreaView style={styles.contentArea}>
        <LiveCourses />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2F8',
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 5 : 45,
    paddingBottom: 5,
    paddingHorizontal: 20,
    backgroundColor: '#8A2BE2', // Purple color
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18, // Further reduced font size
    fontWeight: 'bold',
    color: '#fff', // White color text
  },
  contentArea: {
    flex: 1,
  }
});
