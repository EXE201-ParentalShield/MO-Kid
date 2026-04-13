import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import AppCard from '../components/AppCard';
import SafeButton from '../components/SafeButton';
import StatusBadge from '../components/StatusBadge';

const ProfileSoftScreen = () => {
  const { user, deviceInfo, logout } = useAuth();

  const stats = [
    { label: 'Giới hạn hàng ngày', value: '3 giờ', icon: '⏰' },
    { label: 'Ứng dụng an toàn', value: '6 apps', icon: '🛡️' },
    { label: 'Thời gian học', value: '45 phút', icon: '📚' },
  ];

  const safetyTips = [
    'Không chia sẻ thông tin cá nhân trực tuyến.',
    'Hỏi phụ huynh trước khi tải ứng dụng mới.',
    'Nghỉ mắt đều đặn để thấy dễ chịu hơn.',
    'Nói ra khi có điều gì khiến bạn không thoải mái.',
  ];

  const handleLogout = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('Hoàn tất', 'Bạn đã đăng xuất.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.subtitle}>Tài khoản trẻ em</Text>
      </LinearGradient>

      {deviceInfo && (
        <AppCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thiết bị đang dùng</Text>
            <StatusBadge label={deviceInfo.isLocked ? 'Đã khóa' : 'Hoạt động'} tone={deviceInfo.isLocked ? 'danger' : 'success'} />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tên máy</Text>
            <Text style={styles.detailValue}>{deviceInfo.deviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Loại máy</Text>
            <Text style={styles.detailValue}>{deviceInfo.deviceType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hệ điều hành</Text>
            <Text style={styles.detailValue}>{deviceInfo.osVersion}</Text>
          </View>
        </AppCard>
      )}

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <AppCard key={stat.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </AppCard>
        ))}
      </View>

      <AppCard>
        <Text style={styles.sectionTitle}>Mẹo an toàn trực tuyến</Text>
        {safetyTips.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </AppCard>

      <SafeButton label="Đăng xuất" icon="👋" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  tipBullet: {
    fontSize: 18,
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
});

export default ProfileSoftScreen;
