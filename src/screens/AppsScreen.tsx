import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';

type AppsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Apps'>;
};

const AppsScreen = ({ navigation }: AppsScreenProps) => {
  const allowedApps = [
    { key: 'youtube', name: 'YouTube', icon: '▶️', description: 'Xem video an toàn cho trẻ em', time: '1h 20m' },
    { key: 'instagram', name: 'IG', icon: '📸', description: 'Nội dung đã được lọc an toàn', time: '35m' },
    { key: 'facebook', name: 'FB', icon: '📘', description: 'Chỉ hiển thị nội dung phù hợp', time: '25m' },
    { key: 'threads', name: 'Threads', icon: '🧵', description: 'Chế độ an toàn cho trẻ em', time: '15m' },
  ];

  const handleAppPress = (appKey: string, appName: string) => {
    if (appKey === 'youtube') {
      navigation.navigate('Videos');
      return;
    }

    Alert.alert(
      appName,
      'Nội dung an toàn cho ứng dụng này sẽ sớm được cập nhật. Hãy chọn YouTube để xem video an toàn ngay bây giờ.'
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ứng dụng được phép sử dụng</Text>
        <Text style={styles.subtitle}>{allowedApps.length} ứng dụng an toàn</Text>
        <View style={styles.hintCard}>
          <Text style={styles.hintText}>Bấm vào YouTube để mở danh sách video an toàn.</Text>
        </View>

        {allowedApps.map((app) => (
          <TouchableOpacity
            key={app.key}
            style={styles.appCard}
            activeOpacity={0.85}
            onPress={() => handleAppPress(app.key, app.name)}
          >
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>{app.icon}</Text>
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appDescription}>{app.description}</Text>
              <Text style={styles.appTime}>Đã dùng: {app.time} hôm nay</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
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
  hintCard: {
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#a5f3fc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  hintText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '600',
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
  arrow: {
    fontSize: 28,
    color: '#9ca3af',
    marginLeft: 8,
    lineHeight: 32,
  },
});

export default AppsScreen;
