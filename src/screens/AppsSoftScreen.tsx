import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import AppCard from '../components/AppCard';
import { AllowedAppItem, getAllowedApps } from '../api/apps';

type AppsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Apps'>;
};

const AppsSoftScreen = ({ navigation }: AppsScreenProps) => {
  const [allowedApps, setAllowedApps] = useState<AllowedAppItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failedLogoMap, setFailedLogoMap] = useState<Record<number, boolean>>({});

  const fetchApps = useCallback(async () => {
    try {
      const data = await getAllowedApps();
      setAllowedApps(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách ứng dụng');
      setAllowedApps([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchApps();
    }, [fetchApps])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchApps();
  };

  const isYoutubeApp = useCallback((app: AllowedAppItem) => {
    const name = String(app.appName || '').toLowerCase();
    const pkg = String(app.packageName || '').toLowerCase();
    return name.includes('youtube') || pkg.includes('youtube');
  }, []);

  const displayApps = React.useMemo(() => {
    return [...allowedApps].sort((a, b) => {
      const aIsYoutube = isYoutubeApp(a);
      const bIsYoutube = isYoutubeApp(b);

      if (aIsYoutube && !bIsYoutube) return -1;
      if (!aIsYoutube && bIsYoutube) return 1;
      return a.appName.localeCompare(b.appName);
    });
  }, [allowedApps, isYoutubeApp]);

  const getAppInitial = (name: string) => {
    const cleaned = String(name || '').trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() : 'A';
  };

  const handleAppPress = (app: AllowedAppItem) => {
    if (isYoutubeApp(app)) {
      navigation.navigate('Videos');
      return;
    }

    Alert.alert(
      app.appName,
      'Nội dung an toàn cho ứng dụng này sẽ sớm được cập nhật. Hãy chọn YouTube để xem video an toàn ngay bây giờ.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={styles.hero}>
        <Text style={styles.heroTitle}>Ứng dụng an toàn 🎮</Text>
        <Text style={styles.heroSubtitle}>Chọn nơi bạn muốn khám phá. Danh sách được lấy trực tiếp từ dữ liệu hệ thống.</Text>
      </LinearGradient>

      <AppCard style={styles.hintCard}>
        <Text style={styles.hintTitle}>Gợi ý nhỏ 🎬</Text>
        <Text style={styles.hintText}>Tap to explore safe videos. Hãy thử YouTube để bắt đầu với danh sách video an toàn nhé.</Text>
      </AppCard>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải ứng dụng được phép...</Text>
        </View>
      ) : (
      <View style={styles.list}>
        {displayApps.map((app) => {
          const showImage = !!app.iconUrl && !failedLogoMap[app.appId];

          return (
          <TouchableOpacity key={app.appId} activeOpacity={0.92} onPress={() => handleAppPress(app)}>
            <AppCard>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  {showImage ? (
                    <Image
                      source={{ uri: app.iconUrl }}
                      style={styles.logoImage}
                      resizeMode="contain"
                      onError={() => {
                        setFailedLogoMap((prev) => ({ ...prev, [app.appId]: true }));
                      }}
                    />
                  ) : (
                    <Text style={styles.iconFallback}>{getAppInitial(app.appName)}</Text>
                  )}
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title}>{app.appName}</Text>
                  <Text style={styles.time}>{isYoutubeApp(app) ? 'Mở video an toàn' : 'Sắp hỗ trợ nội dung an toàn'}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
            </AppCard>
          </TouchableOpacity>
          );
        })}

        {displayApps.length === 0 && (
          <AppCard>
            <Text style={styles.emptyTitle}>Chưa có ứng dụng khả dụng</Text>
            <Text style={styles.emptyText}>Hiện chưa có app active trong database.</Text>
          </AppCard>
        )}
      </View>
      )}
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
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
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
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  iconFallback: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default AppsSoftScreen;
