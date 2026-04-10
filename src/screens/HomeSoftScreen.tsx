import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, STORAGE_KEYS } from '../utils/constants';
import { endSession, getDeviceStatus } from '../api/device';
import { getMyRequests } from '../api/requests';
import AppCard from '../components/AppCard';
import SafeButton from '../components/SafeButton';
import StatusBadge from '../components/StatusBadge';
import UsageProgressBar from '../components/UsageProgressBar';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeSoftScreen = ({ navigation }: HomeScreenProps) => {
  const { deviceInfo } = useAuth();
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [approvedMinutes, setApprovedMinutes] = useState(0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestBadgeCount, setRequestBadgeCount] = useState(0);
  const [inAppNotice, setInAppNotice] = useState<{ title: string; message?: string; tone: 'info' | 'success' | 'danger' } | null>(null);
  const isAutoEndingRef = React.useRef(false);
  const requestStatusMapRef = useRef<Record<number, string>>({});

  const loadRequestBadgeCount = useCallback(async () => {
    try {
      const [requests, lastSeenAt] = await Promise.all([
        getMyRequests(),
        AsyncStorage.getItem(STORAGE_KEYS.REQUEST_BADGE_LAST_SEEN_AT),
      ]);

      const count = requests.filter((request) => {
        const status = request.status.toLowerCase();

        // Chỉ tính badge khi parent đã phản hồi request (duyệt/từ chối).
        const isResponded = status === 'approved' || status === 'rejected' || status === 'denied';
        if (!isResponded) return false;

        if (!lastSeenAt) return true;

        const seenTime = new Date(lastSeenAt).getTime();
        if (Number.isNaN(seenTime)) return true;

        const responseTime = new Date(request.respondedAt || request.createdAt).getTime();
        return !Number.isNaN(responseTime) && responseTime > seenTime;
      }).length;

      setRequestBadgeCount(count);
    } catch (error) {
      console.error('[HomeSoftScreen] Error loading request badge count:', error);
      setRequestBadgeCount(0);
    }
  }, []);

  const pollRequestResponseNotifications = useCallback(async () => {
    try {
      const requests = await getMyRequests();
      const nextStatusMap: Record<number, string> = {};

      requests.forEach((request) => {
        nextStatusMap[request.requestId] = request.status.toLowerCase();
      });

      const changedRequest = requests.find((request) => {
        const previousStatus = requestStatusMapRef.current[request.requestId];
        const currentStatus = request.status.toLowerCase();
        const isResponded = currentStatus === 'approved' || currentStatus === 'rejected' || currentStatus === 'denied';
        return !!previousStatus && previousStatus !== currentStatus && isResponded;
      });

      if (changedRequest) {
        const normalizedStatus = changedRequest.status.toLowerCase();
        const approved = normalizedStatus === 'approved';
        setInAppNotice({
          title: approved ? '✅ Phụ huynh đã duyệt yêu cầu' : '❌ Phụ huynh đã từ chối yêu cầu',
          message: approved
            ? `Bạn được dùng thêm ${changedRequest.approvedMinutes || changedRequest.requestedMinutes} phút.`
            : (changedRequest.parentNote || 'Bạn có thể gửi lại yêu cầu khác.'),
          tone: approved ? 'success' : 'danger',
        });
      }

      requestStatusMapRef.current = nextStatusMap;
    } catch {
      // Ignore polling errors to avoid interrupting kid flow.
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const sessionIdStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      const startTimeStr = await AsyncStorage.getItem('sessionStartTime');
      const approvedStr = await AsyncStorage.getItem('sessionApprovedMinutes');
      const localRequestIdStr = await AsyncStorage.getItem('sessionRequestId');

      let statusData: Awaited<ReturnType<typeof getDeviceStatus>> | null = null;
      try {
        statusData = await getDeviceStatus();
      } catch {
        statusData = null;
      }

      if (statusData?.hasActiveSession && statusData.activeSessionId) {
        const sessionStart = statusData.activeSessionStartTime || new Date().toISOString();
        const allowedMinutes = statusData.activeSessionAllowedMinutes ?? statusData.approvedMinutes ?? 0;
        const remainingMinutes = Math.max(0, statusData.activeSessionRemainingMinutes ?? 0);
        const elapsedFromServer = allowedMinutes > 0
          ? Math.max(0, allowedMinutes - remainingMinutes)
          : Math.max(0, Math.floor((Date.now() - new Date(sessionStart).getTime()) / 60000));

        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, String(statusData.activeSessionId));
        await AsyncStorage.setItem('sessionStartTime', sessionStart);
        await AsyncStorage.setItem('sessionApprovedMinutes', String(allowedMinutes));
        if (typeof statusData.activeRequestId === 'number') {
          await AsyncStorage.setItem('sessionRequestId', String(statusData.activeRequestId));
        }

        setSessionId(statusData.activeSessionId);
        setSessionStartTime(new Date(sessionStart));
        setApprovedMinutes(allowedMinutes);
        setElapsedMinutes(elapsedFromServer);
        setHasActiveSession(true);
        return;
      }

      if (statusData && !statusData.hasActiveSession) {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
        await AsyncStorage.removeItem('sessionStartTime');
        await AsyncStorage.removeItem('sessionRequestId');
        await AsyncStorage.removeItem('sessionApprovedMinutes');
        setHasActiveSession(false);
        setSessionId(null);
        setSessionStartTime(null);
        setApprovedMinutes(0);
        setElapsedMinutes(0);
        return;
      }

      if (sessionIdStr && startTimeStr) {
        const localApproved = approvedStr ? parseInt(approvedStr, 10) : 0;
        const localStartTime = new Date(startTimeStr);
        const localElapsed = Math.max(0, Math.floor((Date.now() - localStartTime.getTime()) / 60000));

        setSessionId(parseInt(sessionIdStr, 10));
        setSessionStartTime(localStartTime);
        setHasActiveSession(true);
        setElapsedMinutes(localElapsed);
        setApprovedMinutes(localApproved);
      } else {
        setHasActiveSession(false);
        setSessionId(null);
        setSessionStartTime(null);
        setApprovedMinutes(0);
        setElapsedMinutes(0);
      }
    } catch (error) {
      console.error('[HomeSoftScreen] Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSession();
      loadRequestBadgeCount();
      pollRequestResponseNotifications();

      const intervalId = setInterval(() => {
        loadRequestBadgeCount();
        pollRequestResponseNotifications();
      }, 7000);

      return () => clearInterval(intervalId);
    }, [loadRequestBadgeCount, loadSession, pollRequestResponseNotifications])
  );

  useEffect(() => {
    if (!hasActiveSession || !sessionStartTime) return;

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - sessionStartTime.getTime()) / 60000));
      setElapsedMinutes(elapsed);

      if (approvedMinutes > 0 && elapsed >= approvedMinutes && !isAutoEndingRef.current) {
        handleAutoEndSession(elapsed);
      } else if (approvedMinutes > 0 && approvedMinutes - elapsed === 5) {
        Alert.alert('Sắp hết giờ ⏰', 'Chỉ còn 5 phút nữa thôi, hãy dùng thật hiệu quả nhé.');
      }
    };

    tick();
    const timer = setInterval(tick, 15000);

    return () => clearInterval(timer);
  }, [hasActiveSession, sessionStartTime, approvedMinutes]);

  const handleAutoEndSession = async (elapsedAtEnd: number) => {
    if (!sessionId) return;
    if (isAutoEndingRef.current) return;

    isAutoEndingRef.current = true;
    try {
      const actualUsed = approvedMinutes > 0 ? Math.min(elapsedAtEnd, approvedMinutes) : elapsedAtEnd;
      await endSession(sessionId, actualUsed);
      await saveCompletedRequest();
      await clearSessionData();
      Alert.alert('Hết giờ rồi ⏰', `Bạn đã dùng ${actualUsed} phút trong phiên này.`);
    } catch (error) {
      console.error('[HomeSoftScreen] Error auto-ending session:', error);
    } finally {
      isAutoEndingRef.current = false;
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) {
      Alert.alert('Lỗi', 'Không tìm thấy phiên sử dụng');
      return;
    }

    Alert.alert(
      'Kết thúc phiên',
      `Bạn đã sử dụng ${elapsedMinutes} phút. Bạn muốn kết thúc phiên ngay bây giờ?`,
      [
        { text: 'Chưa', style: 'cancel' },
        {
          text: 'Kết thúc',
          style: 'destructive',
          onPress: async () => {
            setIsEndingSession(true);
            try {
              await endSession(sessionId, elapsedMinutes);
              await saveCompletedRequest();
              await clearSessionData();
              Alert.alert('Hoàn tất', `Phiên sử dụng đã kết thúc sau ${elapsedMinutes} phút.`);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể kết thúc phiên');
            } finally {
              setIsEndingSession(false);
            }
          },
        },
      ]
    );
  };

  const saveCompletedRequest = async () => {
    try {
      const requestIdStr = await AsyncStorage.getItem('sessionRequestId');
      if (!requestIdStr) return;

      const requestId = parseInt(requestIdStr, 10);
      const completedIdsStr = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS);
      const completedIds = completedIdsStr ? JSON.parse(completedIdsStr) : [];

      if (!completedIds.includes(requestId)) {
        completedIds.push(requestId);
        await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS, JSON.stringify(completedIds));
      }
    } catch (error) {
      console.error('[HomeSoftScreen] Error saving completed request:', error);
    }
  };

  const clearSessionData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    await AsyncStorage.removeItem('sessionStartTime');
    await AsyncStorage.removeItem('sessionRequestId');
    await AsyncStorage.removeItem('sessionApprovedMinutes');
    setHasActiveSession(false);
    setSessionId(null);
    setSessionStartTime(null);
    setApprovedMinutes(0);
    setElapsedMinutes(0);
    isAutoEndingRef.current = false;
  };

  const screenTimeUsed = hasActiveSession ? elapsedMinutes : 0;
  const screenTimeLimit = hasActiveSession && approvedMinutes > 0 ? approvedMinutes : 180;
  const screenTimePercentage = screenTimeLimit > 0 ? (screenTimeUsed / screenTimeLimit) * 100 : 0;

  const formatDuration = (minutes: number) => {
    const safeMinutes = Math.max(0, minutes);
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;

    if (hours <= 0) {
      return `${mins} phút`;
    }

    if (mins === 0) {
      return `${hours} tiếng`;
    }

    return `${hours} tiếng ${mins} phút`;
  };

  const menuItems = [
    { title: 'Ứng dụng an toàn', subtitle: 'Khám phá nội dung đã được lọc', screen: 'Apps', icon: '🎮', color: '#DFF7EE' },
    { title: 'Xin thêm thời gian', subtitle: 'Ask your parent nicely 😊', screen: 'Request', icon: '✉️', color: '#FFF4D8' },
    { title: 'Hồ sơ của bé', subtitle: 'Xem thông tin và mẹo an toàn', screen: 'Profile', icon: '🛡️', color: '#E7F2FF' },
  ] as const;

  return (
    <View style={styles.screen}>
      <InAppNotificationBanner
        visible={!!inAppNotice}
        title={inAppNotice?.title || ''}
        message={inAppNotice?.message}
        tone={inAppNotice?.tone || 'info'}
        onDismiss={() => setInAppNotice(null)}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={styles.hero}>
        <Text style={styles.heroEyebrow}>Kid Shield</Text>
        <Text style={styles.heroTitle}>Chào Bé 👋</Text>
        <Text style={styles.heroSubtitle}>
          {hasActiveSession
            ? 'Bạn đang có một phiên sử dụng an toàn đang chạy.'
            : 'Mọi thứ đã được chuẩn bị thật gọn gàng cho con.'}
        </Text>
      </LinearGradient>

      {deviceInfo && (
        <AppCard>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Thiết bị của bạn</Text>
              <Text style={styles.cardSubtitle}>{deviceInfo.deviceName}</Text>
            </View>
            <StatusBadge
              label={deviceInfo.isLocked ? 'Đã khóa' : 'Hoạt động'}
              tone={deviceInfo.isLocked ? 'danger' : 'success'}
            />
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>Loại máy</Text>
              <Text style={styles.infoPillValue}>{deviceInfo.deviceType}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>Hệ điều hành</Text>
              <Text style={styles.infoPillValue}>{deviceInfo.osVersion}</Text>
            </View>
          </View>
        </AppCard>
      )}

      <AppCard>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Thời gian sử dụng</Text>
            <Text style={styles.cardSubtitle}>
              {hasActiveSession ? 'Tiến trình của phiên hiện tại' : 'Hôm nay bạn chưa có phiên nào'}
            </Text>
          </View>
          <Text style={styles.cardIcon}>⏰</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : hasActiveSession ? (
          <>
            <View style={styles.progressStats}>
              <Text style={styles.progressValue}>{formatDuration(screenTimeUsed)}</Text>
              <Text style={styles.progressLimit}>/ {formatDuration(screenTimeLimit)}</Text>
            </View>
            <UsageProgressBar progress={screenTimePercentage} warning={screenTimePercentage > 90} />
            <Text style={[styles.progressHint, screenTimeLimit - screenTimeUsed <= 5 && styles.progressHintWarning]}>
              {screenTimeLimit > screenTimeUsed
                ? `Còn lại ${formatDuration(screenTimeLimit - screenTimeUsed)} để khám phá an toàn`
                : 'Thời gian đã dùng hết'}
            </Text>
            <SafeButton
              label="Kết thúc phiên"
              icon="⏹️"
              variant="danger"
              loading={isEndingSession}
              onPress={handleEndSession}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Chưa có phiên sử dụng nào</Text>
            <Text style={styles.emptyStateText}>Hãy gửi yêu cầu tới phụ huynh khi bạn cần thêm thời gian nhé 😊</Text>
          </View>
        )}
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lối tắt của bé</Text>
        <View style={styles.actionList}>
          {menuItems.map((item) => {
            const isAppsButton = item.screen === 'Apps';
            const isDisabled = isAppsButton && !hasActiveSession;

            return (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.92}
                style={[styles.actionCard, isDisabled && styles.actionCardDisabled]}
                onPress={() => {
                  if (isDisabled) {
                    Alert.alert(
                      'Chưa mở được đâu',
                      'Bạn cần có phiên sử dụng đang hoạt động để vào khu ứng dụng an toàn.'
                    );
                  } else {
                    navigation.navigate(item.screen);
                  }
                }}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: item.color }]}>
                  <Text style={styles.actionIcon}>{item.icon}</Text>
                </View>
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                </View>
                {item.screen === 'Request' && requestBadgeCount > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{requestBadgeCount > 99 ? '99+' : requestBadgeCount}</Text>
                  </View>
                ) : null}
                {isDisabled ? <StatusBadge label="Đợi phiên" tone="warning" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <AppCard style={styles.tipCard}>
        <Text style={styles.cardTitle}>Mẹo nhỏ an toàn</Text>
        <Text style={styles.tipText}>You’re safe here. Hãy hỏi phụ huynh nếu có gì khiến bạn bối rối hoặc chưa chắc chắn.</Text>
        <Text style={styles.tipText}>Nghỉ mắt đều đặn và dùng thời gian online cho những điều vui vẻ, có ích nhé 🎉</Text>
      </AppCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    shadowColor: '#17322A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardIcon: {
    fontSize: 26,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoPill: {
    flex: 1,
    backgroundColor: '#F2FAF7',
    borderRadius: 16,
    padding: 14,
  },
  infoPillLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoPillValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
  },
  progressLimit: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  progressHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 14,
  },
  progressHintWarning: {
    color: '#B45309',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  actionList: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#17322A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  actionCardDisabled: {
    opacity: 0.75,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  tipCard: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginTop: 6,
  },
});

export default HomeSoftScreen;
