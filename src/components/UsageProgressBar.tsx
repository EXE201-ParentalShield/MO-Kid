import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type UsageProgressBarProps = {
  progress: number;
  warning?: boolean;
};

const UsageProgressBar = ({ progress, warning = false }: UsageProgressBarProps) => {
  const clampedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <View style={styles.track}>
      <LinearGradient
        colors={warning ? ['#F6AD55', '#E57373'] : ['#4CAF93', '#7CD6BF']}
        style={[styles.fill, { width: `${clampedProgress}%` }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 12,
    backgroundColor: '#E8F3EF',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default UsageProgressBar;
