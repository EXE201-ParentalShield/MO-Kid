import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

const toneStyles = {
  success: { backgroundColor: '#DCFCE7', color: '#166534' },
  warning: { backgroundColor: '#FEF3C7', color: '#92400E' },
  danger: { backgroundColor: '#FDE2E2', color: '#B42318' },
  info: { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  neutral: { backgroundColor: '#E5E7EB', color: '#374151' },
};

const StatusBadge = ({ label, tone = 'neutral' }: StatusBadgeProps) => {
  const current = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: current.backgroundColor }]}>
      <Text style={[styles.text, { color: current.color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default StatusBadge;
