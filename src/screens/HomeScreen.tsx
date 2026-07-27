import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>JogaMuito</Text>
      <Text style={styles.subtitle}>Seu app inicial para experiências esportivas.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f7fb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
});

export default HomeScreen;
