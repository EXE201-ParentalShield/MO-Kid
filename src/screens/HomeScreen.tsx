import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const screenTimeUsed = 105; // minutes
  const screenTimeLimit = 180; // 3 hours
  const screenTimePercentage = (screenTimeUsed / screenTimeLimit) * 100;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const menuItems = [
    { title: 'Ứng dụng được phép', screen: 'Apps', icon: '📱', color: '#3b82f6' },
    { title: 'Thông tin cá nhân', screen: 'Profile', icon: '👤', color: '#8b5cf6' },
    { title: 'Yêu cầu truy cập', screen: 'Request', icon: '✋', color: '#f59e0b' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Xin chào! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Chế độ an toàn đã được bật</Text>
        </View>

        <View style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Text style={styles.timeIcon}>⏰</Text>
            <Text style={styles.timeTitle}>Thời gian sử dụng hôm nay</Text>
          </View>
          
          <View style={styles.timeProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${screenTimePercentage}%` }
                ]} 
              />
            </View>
            <View style={styles.timeStats}>
              <Text style={styles.timeUsed}>{formatTime(screenTimeUsed)}</Text>
              <Text style={styles.timeSeparator}>/</Text>
              <Text style={styles.timeTotal}>{formatTime(screenTimeLimit)}</Text>
            </View>
          </View>

          <Text style={styles.timeRemaining}>
            Còn lại {formatTime(screenTimeLimit - screenTimeUsed)} ⏳
          </Text>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderLeftColor: item.color }]}
              onPress={() => navigation.navigate(item.screen as any)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Mẹo an toàn</Text>
          <Text style={styles.tipsText}>
            • Không chia sẻ thông tin cá nhân trực tuyến{'\n'}
            • Luôn hỏi phụ huynh trước khi tải ứng dụng mới{'\n'}
            • Nghỉ ngơi đều đặn để bảo vệ mắt
          </Text>
        </View>
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
  welcomeCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  timeCard: {
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
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  timeStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeUsed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timeSeparator: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  timeTotal: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  timeRemaining: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  menuGrid: {
    gap: 12,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipsCard: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default HomeScreen;
