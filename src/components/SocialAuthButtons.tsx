import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SocialAuthButtonsProps = {
  onGooglePress: () => void;
  onFacebookPress: () => void;
  onApplePress: () => void;
  loading?: 'google' | 'facebook' | 'apple' | null;
  disabled?: boolean;
};

const SocialAuthButtons = ({
  onGooglePress,
  onFacebookPress,
  onApplePress,
  loading = null,
  disabled = false,
}: SocialAuthButtonsProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.dividerText}>ou continue com</Text>

      <Pressable
        style={[styles.button, styles.googleButton]}
        onPress={onGooglePress}
        disabled={disabled || loading === 'google'}
      >
        <Text style={styles.buttonText}>{loading === 'google' ? 'Entrando...' : 'Google'}</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.facebookButton]}
        onPress={onFacebookPress}
        disabled={disabled || loading === 'facebook'}
      >
        <Text style={styles.buttonText}>{loading === 'facebook' ? 'Entrando...' : 'Facebook'}</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.appleButton]}
        onPress={onApplePress}
        disabled={disabled || loading === 'apple'}
      >
        <Text style={styles.buttonText}>{loading === 'apple' ? 'Entrando...' : 'Apple'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  dividerText: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 12,
    fontSize: 13,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#db4437',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
  },
  appleButton: {
    backgroundColor: '#111827',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default SocialAuthButtons;
