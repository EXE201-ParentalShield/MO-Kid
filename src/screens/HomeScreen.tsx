import React, { useState, useEffect, useCallback } from 'react';
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
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, STORAGE_KEYS } from '../utils/constants';
import { endSession } from '../api/device';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { deviceInfo } = useAuth();
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [approvedMinutes, setApprovedMinutes] = useState(0);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage
  const loadSession = useCallback(async () => {
    try {
      const sessionIdStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      const startTimeStr = await AsyncStorage.getItem('sessionStartTime');
      const requestIdStr = await AsyncStorage.getItem('sessionRequestId');
      
      if (sessionIdStr && startTimeStr) {
        setSessionId(parseInt(sessionIdStr));
        setSessionStartTime(new Date(startTimeStr));
        setHasActiveSession(true);
        
        // Get approved minutes from request (you may want to store this separately)
        // For now, we'll calculate elapsed time
        const startTime = new Date(startTimeStr);
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 60000);
        setElapsedMinutes(elapsed);
        
        // Try to get approved minutes from storage (saved during start session)
        const approvedStr = await AsyncStorage.getItem('sessionApprovedMinutes');
        if (approvedStr) {
          setApprovedMinutes(parseInt(approvedStr));
        }
      } else {
        setHasActiveSession(false);
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [loadSession])
  );

  // Update elapsed time every minute
  useEffect(() => {
    if (!hasActiveSession || !sessionStartTime) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 60000);
      setElapsedMinutes(elapsed);

      // Auto end session if time runs out
      if (approvedMinutes > 0 && elapsed >= approvedMinutes) {
        handleAutoEndSession();
      }
      // Warning when 5 minutes left
      else if (approvedMinutes > 0 && (approvedMinutes - elapsed) === 5) {
        Alert.alert('⚠️ Cảnh báo', 'Chỉ còn 5 phút nữa thời gian sử dụng sẽ hết!');
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [hasActiveSession, sessionStartTime, approvedMinutes, elapsedMinutes]);

  const handleAutoEndSession = async () => {
    if (!sessionId) return;
    
    console.log('[HomeScreen] Auto-ending session, sessionId:', sessionId);
    try {
      await endSession(sessionId, elapsedMinutes);
      console.log('[HomeScreen] Session ended on server, now saving completed request...');
      await saveCompletedRequest();
      console.log('[HomeScreen] Completed request saved, now clearing session data...');
      await clearSessionData();
      Alert.alert(
        'Hết giờ! ⏰',
        `Thời gian sử dụng của bạn đã hết. Bạn đã dùng ${elapsedMinutes} phút.`
      );
    } catch (error) {
      console.error('[HomeScreen] Error auto-ending session:', error);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) {
      Alert.alert('Lỗi', 'Không tìm thấy phiên sờ dụng');
      return;
    }

    Alert.alert(
      'Kết thúc phiên',
      `Bạn đã sử dụng ${elapsedMinutes} phút. Bạn muốn kết thúc phiên ngay bây giờ?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Kết thúc',
          style: 'destructive',
          onPress: async () => {
            setIsEndingSession(true);
            console.log('[HomeScreen] Manual ending session, sessionId:', sessionId);
            try {
              await endSession(sessionId, elapsedMinutes);
              console.log('[HomeScreen] Session ended on server, now saving completed request...');
              await saveCompletedRequest();
              console.log('[HomeScreen] Completed request saved, now clearing session data...');
              await clearSessionData();
              Alert.alert(
                'Thành công',
                `Phiên sử dụng đã kết thúc. Bạn đã dùng ${elapsedMinutes} phút.`
              );
            } catch (error: any) {
              console.error('[HomeScreen] Error ending session:', error);
              Alert.alert('Lỗi', error.message || 'Không thể kết thúc phiên');
            } finally {
              setIsEndingSession(false);
            }
          }
        }
      ]
    );
  };

  const saveCompletedRequest = async () => {
    try {
      console.log('[HomeScreen] Starting saveCompletedRequest...');
      const requestIdStr = await AsyncStorage.getItem('sessionRequestId');
      console.log('[HomeScreen] Got sessionRequestId from AsyncStorage:', requestIdStr);
      
      if (!requestIdStr) {
        console.warn('[HomeScreen] WARNING: sessionRequestId is null or empty!');
        return;
      }
      
      const requestId = parseInt(requestIdStr);
      console.log('[HomeScreen] Parsed requestId:', requestId);
      
      const completedIdsStr = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS);
      console.log('[HomeScreen] Current completed IDs string:', completedIdsStr);
      const completedIds = completedIdsStr ? JSON.parse(completedIdsStr) : [];
      console.log('[HomeScreen] Current completed IDs array:', completedIds);
      
      if (!completedIds.includes(requestId)) {
        completedIds.push(requestId);
        console.log('[HomeScreen] Adding requestId to completed list:', requestId);
        await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS, JSON.stringify(completedIds));
        console.log('[HomeScreen] ✅ Successfully saved completed IDs:', completedIds);
      } else {
        console.log('[HomeScreen] Request already marked as completed:', requestId);
      }
    } catch (error) {
      console.error('[HomeScreen] ❌ Error saving completed request:', error);
    }
  };

  const clearSessionData = async () => {
    console.log('[HomeScreen] Clearing session data...');
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    await AsyncStorage.removeItem('sessionStartTime');
    await AsyncStorage.removeItem('sessionRequestId');
    await AsyncStorage.removeItem('sessionApprovedMinutes');
    setHasActiveSession(false);
    setSessionId(null);
    setSessionStartTime(null);
    setApprovedMinutes(0);
    setElapsedMinutes(0);
    console.log('[HomeScreen] Session data cleared');
  };

  const screenTimeUsed = hasActiveSession ? elapsedMinutes : 0;
  const screenTimeLimit = hasActiveSession && approvedMinutes > 0 ? approvedMinutes : 180;
  const screenTimePercentage = screenTimeLimit > 0 ? (screenTimeUsed / screenTimeLimit) * 100 : 0;

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
          <Text style={styles.welcomeSubtitle}>
            {hasActiveSession ? 'Phiên sờ dụng đang hoạt động' : 'Chế độ an toàn đã được bật'}
          </Text>
        </View>

        {deviceInfo && (
          <View style={styles.deviceCard}>
            <Text style={styles.deviceCardTitle}>📱 Thiết bị của bạn</Text>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceLabel}>Tên thiết bị:</Text>
              <Text style={styles.deviceValue}>{deviceInfo.deviceName}</Text>
            </View>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceLabel}>Loại:</Text>
              <Text style={styles.deviceValue}>{deviceInfo.deviceType}</Text>
            </View>
            <View style={styles.deviceInfoRow}>
              <Text style={styles.deviceLabel}>Trạng thái:</Text>
              <Text style={[styles.deviceValue, deviceInfo.isLocked ? styles.locked : styles.active]}>
                {deviceInfo.isLocked ? '🔒 Đã khóa' : '✅ Hoạt động'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Text style={styles.timeIcon}>⏰</Text>
            <Text style={styles.timeTitle}>
              {hasActiveSession ? 'Thời gian sử dụng hiện tại' : 'Thời gian sử dụng hôm nay'}
            </Text>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : hasActiveSession ? (
            <>
              <View style={styles.timeProgress}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(screenTimePercentage, 100)}%` },
                      screenTimePercentage > 90 && styles.progressFillWarning
                    ]} 
                  />
                </View>
                <View style={styles.timeStats}>
                  <Text style={styles.timeUsed}>{formatTime(screenTimeUsed)}</Text>
                  <Text style={styles.timeSeparator}>/</Text>
                  <Text style={styles.timeTotal}>{formatTime(screenTimeLimit)}</Text>
                </View>
              </View>

              <Text style={[
                styles.timeRemaining,
                (screenTimeLimit - screenTimeUsed) <= 5 && styles.timeRemainingWarning
              ]}>
                {screenTimeLimit > screenTimeUsed 
                  ? `Còn lại ${formatTime(screenTimeLimit - screenTimeUsed)} ⏳`
                  : 'Hết giờ! ⏰'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.endSessionButton,
                  isEndingSession && styles.endSessionButtonDisabled
                ]}
                onPress={handleEndSession}
                disabled={isEndingSession}
              >
                {isEndingSession ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.endSessionButtonText}>⏹️ Kết thúc phiên</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noSessionContainer}>
              <Text style={styles.noSessionText}>
                Không có phiên sử dụng nào đang hoạt động
              </Text>
              <Text style={styles.noSessionHint}>
                Tạo yêu cầu và đợi phụ huynh duyệt để bắt đầu sử dụng
              </Text>
            </View>
          )}
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => {
            const isAppsButton = item.screen === 'Apps';
            const isDisabled = isAppsButton && !hasActiveSession;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem, 
                  { borderLeftColor: item.color },
                  isDisabled && styles.menuItemDisabled
                ]}
                onPress={() => {
                  if (isDisabled) {
                    Alert.alert(
                      '⚠️ Không thể truy cập',
                      'Bạn cần có phiên sử dụng đang hoạt động để xem ứng dụng được phép.',
                      [{ text: 'OK' }]
                    );
                  } else {
                    navigation.navigate(item.screen as any);
                  }
                }}
              >
                <Text style={[styles.menuIcon, isDisabled && styles.menuIconDisabled]}>{item.icon}</Text>
                <Text style={[styles.menuTitle, isDisabled && styles.menuTitleDisabled]}>{item.title}</Text>
                {isDisabled && (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>🔒</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
  deviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  progressFillWarning: {
    backgroundColor: '#ef4444',
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
    marginBottom: 12,
  },
  timeRemainingWarning: {
    color: '#ef4444',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSessionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSessionText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noSessionHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  endSessionButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  endSessionButtonDisabled: {
    opacity: 0.6,
  },
  endSessionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  menuItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#f3f4f6',
  },
  menuIconDisabled: {
    opacity: 0.4,
  },
  menuTitleDisabled: {
    color: '#9ca3af',
  },
  lockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadgeText: {
    fontSize: 12,
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
