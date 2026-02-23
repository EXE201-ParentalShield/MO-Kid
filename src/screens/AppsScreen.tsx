import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { COLORS } from '../utils/constants';

const AppsScreen = () => {
  const allowedApps = [
    { name: 'YouTube Kids', icon: '🎥', description: 'Video an toàn cho trẻ em', time: '2h 15m' },
    { name: 'Messenger Kids', icon: '💬', description: 'Nhắn tin với bạn bè', time: '45m' },
    { name: 'Khan Academy Kids', icon: '📚', description: 'Học tập và giải trí', time: '1h 30m' },
    { name: 'Google Chrome', icon: '🌐', description: 'Trình duyệt được lọc', time: '1h' },
    { name: 'Duolingo', icon: '🦉', description: 'Học ngôn ngữ', time: '30m' },
    { name: 'Scratch Jr', icon: '🎨', description: 'Lập trình sáng tạo', time: '45m' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ứng dụng được phép sử dụng</Text>
        <Text style={styles.subtitle}>{allowedApps.length} ứng dụng an toàn</Text>

        {allowedApps.map((app, index) => (
          <View key={index} style={styles.appCard}>
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>{app.icon}</Text>
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appDescription}>{app.description}</Text>
              <Text style={styles.appTime}>Đã dùng: {app.time} hôm nay</Text>
            </View>
          </View>
        ))}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  appCard: {
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
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 32,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  appTime: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default AppsScreen;
