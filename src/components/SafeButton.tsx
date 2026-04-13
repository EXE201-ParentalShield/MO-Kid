import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

type SafeButtonProps = {
  label: string;
  icon?: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
};

const variants = {
  primary: {
    colors: [COLORS.primary, '#5CC2A8'] as const,
    text: '#FFFFFF',
  },
  secondary: {
    colors: ['#EFFCF7', '#E3F6FF'] as const,
    text: COLORS.primaryDark,
  },
  danger: {
    colors: ['#FDECEC', '#FDE2E2'] as const,
    text: '#B42318',
  },
};

const SafeButton = ({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = true,
}: SafeButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const tone = variants[variant];

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 24,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && styles.fullWidth]}>
      <Pressable
        disabled={disabled || loading}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
      >
        <LinearGradient
          colors={tone.colors}
          style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color={tone.text} />
          ) : (
            <View style={styles.content}>
              {icon ? <Text style={[styles.icon, { color: tone.text }]}>{icon}</Text> : null}
              <Text style={[styles.label, { color: tone.text }]}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#17322A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default SafeButton;
