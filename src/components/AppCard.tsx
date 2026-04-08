import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

type AppCardProps = ViewProps & {
  children: React.ReactNode;
  padded?: boolean;
};

const AppCard = ({ children, style, padded = true, ...rest }: AppCardProps) => {
  return (
    <LinearGradient colors={['#FFFFFF', '#F8FCFA']} style={[styles.card, padded && styles.padded, style]}>
      <View {...rest}>{children}</View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#17322A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  padded: {
    padding: 18,
  },
});

export default AppCard;
