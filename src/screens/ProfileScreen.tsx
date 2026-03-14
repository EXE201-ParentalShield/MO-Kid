import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

const ProfileScreen = () => {
  const { user, deviceInfo, logout } = useAuth();

  const stats = [
    { label: 'Giới hạn hàng ngày', value: '3 giờ', icon: '⏰' },
    { label: 'Ứng dụng an toàn', value: '6 apps', icon: '🛡️' },
    { label: 'Thời gian học', value: '45 phút', icon: '📚' },
  ];

  const safetyTips = [
    'Không chia sẻ thông tin cá nhân trực tuyến',
    'Luôn hỏi phụ huynh trước khi tải xuống ứng dụng mới',
    'Nghỉ ngơi đều đặn để nghỉ mắt',
    'Nói với phụ huynh nếu có điều gì khiến bạn khó chịu',
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            Alert.alert('Thành công', 'Đã đăng xuất!');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.accountType}>Tài khoản trẻ em</Text>
        </View>

        {deviceInfo && (
          <View style={styles.deviceCard}>
            <Text style={styles.deviceTitle}>📱 Thông tin thiết bị</Text>
            <View style={styles.deviceInfo}>
              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>Tên thiết bị:</Text>
                <Text style={styles.deviceValue}>{deviceInfo.deviceName}</Text>
              </View>
              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>Loại:</Text>
                <Text style={styles.deviceValue}>{deviceInfo.deviceType}</Text>
              </View>
              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>Hệ điều hành:</Text>
                <Text style={styles.deviceValue}>{deviceInfo.osVersion}</Text>
              </View>
              <View style={styles.deviceRow}>
                <Text style={styles.deviceLabel}>Trạng thái:</Text>
                <Text style={[styles.deviceValue, deviceInfo.isLocked ? styles.locked : styles.active]}>
                  {deviceInfo.isLocked ? '🔒 Đã khóa' : '✅ Hoạt động'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statsSection}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.safetySection}>
          <Text style={styles.sectionTitle}>🛡️ Mẹo an toàn trực tuyến</Text>
          {safetyTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
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
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  deviceInfo: {
    gap: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deviceValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  active: {
    color: COLORS.success,
  },
  locked: {
    color: COLORS.danger,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsSection: {
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  safetySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
