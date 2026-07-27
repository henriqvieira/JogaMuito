import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type AppCardProps = {
  title: string;
  description: string;
};

const AppCard = ({ title, description }: AppCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default AppCard;
