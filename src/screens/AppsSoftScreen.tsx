import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import AppCard from '../components/AppCard';

type AppsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Apps'>;
};

const AppsSoftScreen = ({ navigation }: AppsScreenProps) => {
  const allowedApps = [
    { key: 'youtube', name: 'YouTube', icon: '▶️', description: 'Safe content enabled', time: '1h 20m' },
    { key: 'instagram', name: 'IG', icon: '📸', description: 'Safe content enabled', time: '35m' },
    { key: 'facebook', name: 'FB', icon: '📘', description: 'Safe content enabled', time: '25m' },
    { key: 'threads', name: 'Threads', icon: '🧵', description: 'Safe content enabled', time: '15m' },
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={styles.hero}>
        <Text style={styles.heroTitle}>Ứng dụng an toàn 🎮</Text>
        <Text style={styles.heroSubtitle}>Chọn nơi bạn muốn khám phá. Mọi nội dung ở đây đều được làm mềm và an toàn hơn.</Text>
      </LinearGradient>

      <AppCard style={styles.hintCard}>
        <Text style={styles.hintTitle}>Gợi ý nhỏ 🎬</Text>
        <Text style={styles.hintText}>Tap to explore safe videos. Hãy thử YouTube để bắt đầu với danh sách video an toàn nhé.</Text>
      </AppCard>

      <View style={styles.list}>
        {allowedApps.map((app) => (
          <TouchableOpacity key={app.key} activeOpacity={0.92} onPress={() => handleAppPress(app.key, app.name)}>
            <AppCard>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Text style={styles.icon}>{app.icon}</Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title}>{app.name}</Text>
                  <Text style={styles.description}>{app.description}</Text>
                  <Text style={styles.time}>Đã dùng {app.time} hôm nay</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </AppCard>
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
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 24,
    padding: 24,
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  hintCard: {
    backgroundColor: '#F0FDFA',
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EFFCF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 28,
    color: '#94A3B8',
    lineHeight: 28,
  },
});

export default AppsSoftScreen;
