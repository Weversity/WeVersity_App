import React from 'react';
import { StyleSheet, TextInput, View, Text } from 'react-native';

const PhoneNumberInputWeb = ({ defaultValue, onChangeText, ...props }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        defaultValue={defaultValue}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Add any container styling if needed
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333', // Adjust color as needed
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff', // Ensure a background for visibility
  },
});

export default PhoneNumberInputWeb;