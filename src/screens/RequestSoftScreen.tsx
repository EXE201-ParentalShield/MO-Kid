import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, STORAGE_KEYS } from '../utils/constants';
import { createAccessRequest, getMyRequests, AccessRequest } from '../api/requests';
import { startSession, getDeviceStatus } from '../api/device';
import { RootStackParamList } from '../navigation/AppNavigator';
import AppCard from '../components/AppCard';
import SafeButton from '../components/SafeButton';
import StatusBadge from '../components/StatusBadge';
import InAppNotificationBanner from '../components/InAppNotificationBanner';
import { startKioskModeForSession } from '../services/kioskModeService';

type RequestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Request'>;

type SessionSyncState = {
  hasActiveSession: boolean;
  activeRequestId: number | null;
};

const RequestSoftScreen = () => {
  const navigation = useNavigation<RequestScreenNavigationProp>();
  const [requestedMinutes, setRequestedMinutes] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingRequestId, setStartingRequestId] = useState<number | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [sessionApprovedMinutes, setSessionApprovedMinutes] = useState(0);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [completedRequestIds, setCompletedRequestIds] = useState<number[]>([]);
  const [approvedRequestIdFromServer, setApprovedRequestIdFromServer] = useState<number | null>(null);
  const [hasLoadedDeviceStatus, setHasLoadedDeviceStatus] = useState(false);
  const [hasDeviceStatusError, setHasDeviceStatusError] = useState(false);
  const [inAppNotice, setInAppNotice] = useState<{ title: string; message?: string; tone: 'info' | 'success' | 'danger' } | null>(null);
  const hasMarkedSeenRef = React.useRef(false);
  const requestStatusMapRef = useRef<Record<number, string>>({});

  const markRequestsAsSeen = useCallback(async () => {
    if (hasMarkedSeenRef.current) return;
    hasMarkedSeenRef.current = true;
    await AsyncStorage.setItem(STORAGE_KEYS.REQUEST_BADGE_LAST_SEEN_AT, new Date().toISOString());
  }, []);

  const checkActiveSession = useCallback(async (): Promise<SessionSyncState> => {
    try {
      const sessionId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      const approvedMinutesStr = await AsyncStorage.getItem('sessionApprovedMinutes');
      const requestIdStr = await AsyncStorage.getItem('sessionRequestId');

      const completedIdsStr = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS);
      const completedIds = completedIdsStr ? JSON.parse(completedIdsStr) : [];
      setCompletedRequestIds(completedIds);

      try {
        const status = await getDeviceStatus();
        const approvedId = typeof status.approvedRequestId === 'number' ? status.approvedRequestId : null;
        setApprovedRequestIdFromServer(approvedId);

        if (status.hasActiveSession && status.activeSessionId) {
          const allowedMinutes = status.activeSessionAllowedMinutes ?? status.approvedMinutes ?? 0;
          const syncedActiveRequestId = typeof status.activeRequestId === 'number' ? status.activeRequestId : null;
          setHasActiveSession(true);
          setSessionApprovedMinutes(allowedMinutes);
          setActiveRequestId(syncedActiveRequestId);

          await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, String(status.activeSessionId));
          if (status.activeSessionStartTime) {
            await AsyncStorage.setItem('sessionStartTime', status.activeSessionStartTime);
          }
          await AsyncStorage.setItem('sessionApprovedMinutes', String(allowedMinutes));
          if (syncedActiveRequestId !== null) {
            await AsyncStorage.setItem('sessionRequestId', String(syncedActiveRequestId));
          }

          return {
            hasActiveSession: true,
            activeRequestId: syncedActiveRequestId,
          };
        } else {
          setHasActiveSession(false);
          setSessionApprovedMinutes(0);
          setActiveRequestId(null);

          await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
          await AsyncStorage.removeItem('sessionStartTime');
          await AsyncStorage.removeItem('sessionRequestId');
          await AsyncStorage.removeItem('sessionApprovedMinutes');

          return {
            hasActiveSession: false,
            activeRequestId: null,
          };
        }

        setHasDeviceStatusError(false);
      } catch {
        const fallbackActiveRequestId = requestIdStr ? parseInt(requestIdStr, 10) : null;

        if (sessionId) {
          setHasActiveSession(true);
          setSessionApprovedMinutes(approvedMinutesStr ? parseInt(approvedMinutesStr, 10) : 0);
          setActiveRequestId(fallbackActiveRequestId);
        } else {
          setHasActiveSession(false);
          setSessionApprovedMinutes(0);
          setActiveRequestId(null);
        }

        setApprovedRequestIdFromServer(null);
        setHasDeviceStatusError(true);

        return {
          hasActiveSession: !!sessionId,
          activeRequestId: sessionId ? fallbackActiveRequestId : null,
        };
      } finally {
        setHasLoadedDeviceStatus(true);
      }
    } catch (error) {
      console.error('[RequestSoftScreen] Error checking session:', error);
      setHasDeviceStatusError(true);
      setHasLoadedDeviceStatus(true);

      return {
        hasActiveSession: false,
        activeRequestId: null,
      };
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyRequests();
      setRequests(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const pollRequestResponseNotifications = useCallback(async () => {
    try {
      const requestsData = await getMyRequests();
      const nextStatusMap: Record<number, string> = {};

      requestsData.forEach((request) => {
        nextStatusMap[request.requestId] = request.status.toLowerCase();
      });

      const changedRequest = requestsData.find((request) => {
        const previousStatus = requestStatusMapRef.current[request.requestId];
        const currentStatus = request.status.toLowerCase();
        const isResponded = currentStatus === 'approved' || currentStatus === 'rejected' || currentStatus === 'denied';
        return !!previousStatus && previousStatus !== currentStatus && isResponded;
      });

      if (changedRequest) {
        const approved = changedRequest.status.toLowerCase() === 'approved';
        setInAppNotice({
          title: approved ? '✅ Yêu cầu đã được duyệt' : '❌ Yêu cầu đã bị từ chối',
          message: approved
            ? `Bạn được dùng ${changedRequest.approvedMinutes || changedRequest.requestedMinutes} phút.`
            : (changedRequest.parentNote || 'Bạn có thể gửi yêu cầu khác.'),
          tone: approved ? 'success' : 'danger',
        });
      }

      requestStatusMapRef.current = nextStatusMap;
    } catch {
      // Keep polling silent to avoid interrupting the request screen.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      hasMarkedSeenRef.current = false;

      const loadData = async () => {
        await markRequestsAsSeen();
        await checkActiveSession();
        await fetchRequests();
        await pollRequestResponseNotifications();
      };
      loadData();

      const intervalId = setInterval(() => {
        pollRequestResponseNotifications();
      }, 5000);

      return () => clearInterval(intervalId);
    }, [checkActiveSession, fetchRequests, markRequestsAsSeen, pollRequestResponseNotifications])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await checkActiveSession();
    await fetchRequests();
  };

  const handleSubmit = async () => {
    const minutes = parseInt(requestedMinutes, 10);

    if (!requestedMinutes || Number.isNaN(minutes) || minutes <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số phút hợp lệ lớn hơn 0');
      return;
    }

    if (minutes > 480) {
      Alert.alert('Lỗi', 'Số phút không được vượt quá 480 phút');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do');
      return;
    }

    setIsSubmitting(true);

    try {
      await createAccessRequest(minutes, reason.trim());
      Alert.alert('Request sent 🎉', 'Yêu cầu của bạn đã được gửi đến phụ huynh.');
      setRequestedMinutes('');
      setReason('');
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusTone = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
      case 'denied':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Đang chờ';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
      case 'denied':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const getIsRequestCompleted = useCallback(
    (request: AccessRequest, isCurrentlyActive: boolean) => {
      const isCompletedFromServerFlag = request.isCompleted === true;
      if (isCompletedFromServerFlag) return true;

      const isCompletedFromLocal = completedRequestIds.includes(request.requestId);
      if (isCompletedFromLocal) return true;

      const normalizedStatus = request.status.toLowerCase();
      const isApproved = normalizedStatus === 'approved';

      if (hasLoadedDeviceStatus && !hasDeviceStatusError && isApproved && !isCurrentlyActive) {
        // If server points to another approved request, this one is no longer actionable.
        // Do not auto-complete when approvedRequestId is null to avoid premature completion
        // before backend status propagation is fully visible on this client.
        if (approvedRequestIdFromServer !== null && approvedRequestIdFromServer !== request.requestId) {
          return true;
        }
      }

      return false;
    },
    [approvedRequestIdFromServer, completedRequestIds, hasDeviceStatusError, hasLoadedDeviceStatus]
  );

  const actionableApprovedFallback = requests
    .filter((request) => {
      const normalizedStatus = request.status.toLowerCase();
      const isCurrentlyActive = hasActiveSession && activeRequestId === request.requestId;
      const isCompleted = getIsRequestCompleted(request, isCurrentlyActive);
      return normalizedStatus === 'approved' && !isCompleted;
    })
    .sort((a, b) => {
      const aTime = new Date(a.respondedAt || a.createdAt).getTime();
      const bTime = new Date(b.respondedAt || b.createdAt).getTime();
      return bTime - aTime;
    })[0];

  const actionableApprovedRequestId =
    hasLoadedDeviceStatus && !hasDeviceStatusError && approvedRequestIdFromServer !== null
      ? approvedRequestIdFromServer
      : (actionableApprovedFallback?.requestId ?? null);

  const blockingRequest = requests.find((request) => {
    const normalizedStatus = request.status.toLowerCase();
    const isCurrentlyActive = hasActiveSession && activeRequestId === request.requestId;
    const isCompleted = getIsRequestCompleted(request, isCurrentlyActive);
    const isActionableApproved =
      normalizedStatus === 'approved' &&
      actionableApprovedRequestId !== null &&
      request.requestId === actionableApprovedRequestId;

    return !isCompleted && (normalizedStatus === 'pending' || isActionableApproved);
  });

  const requestFormLocked = hasActiveSession || !!blockingRequest;

  const requestLockTitle = hasActiveSession
    ? 'Bạn đang có thời gian được duyệt'
    : blockingRequest?.status.toLowerCase() === 'pending'
      ? 'Bạn đã gửi yêu cầu rồi'
      : 'Bạn đang có yêu cầu đã được duyệt';

  const requestLockText = hasActiveSession
    ? `Hiện bạn có ${sessionApprovedMinutes} phút đang hoạt động. Hãy kết thúc phiên hiện tại trước khi gửi yêu cầu mới.`
    : blockingRequest?.status.toLowerCase() === 'pending'
      ? 'Yêu cầu gần nhất vẫn đang chờ phụ huynh phản hồi. Tạm thời bạn chưa thể gửi thêm yêu cầu mới.'
      : 'Yêu cầu trước đó đã được duyệt. Hãy bắt đầu và hoàn thành phiên sử dụng đó trước khi tạo yêu cầu tiếp theo.';

  const handleStartSession = async (requestId: number) => {
    const request = requests.find((r) => r.requestId === requestId);
    if (!request || !request.approvedMinutes) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin yêu cầu');
      return;
    }

    Alert.alert(
      'Bắt đầu phiên sử dụng',
      `Bạn muốn bắt đầu với ${request.approvedMinutes} phút được phê duyệt?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu',
          onPress: async () => {
            setStartingRequestId(requestId);
            try {
              const response = await startSession(requestId);
              const sessionId = response.data.usageSessionId;
              const sessionStartTime = response.data.startTime || new Date().toISOString();
              const approvedFromSession = response.data.allowedMinutes || request.approvedMinutes || 0;

              await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, sessionId.toString());
              await AsyncStorage.setItem('sessionStartTime', sessionStartTime);
              await AsyncStorage.setItem('sessionRequestId', requestId.toString());
              await AsyncStorage.setItem('sessionApprovedMinutes', approvedFromSession.toString());

              const kioskStarted = await startKioskModeForSession();
              console.log('[SessionFlow] kiosk start result', { kioskStarted, requestId, sessionId });

              await checkActiveSession();

              Alert.alert('Bắt đầu rồi 🎉', `Bạn có ${approvedFromSession} phút. Chúc bạn có khoảng thời gian vui vẻ và an toàn!`, [
                { text: 'OK', onPress: () => navigation.navigate('Home') },
              ]);
            } catch (error: any) {
              const message = String(error?.message || 'Không thể bắt đầu phiên sử dụng');
              const normalized = message.toLowerCase();

              const isAlreadyActiveError =
                normalized.includes('session is already active') ||
                normalized.includes('already active on this device');
              const isDuplicateOrUsedError =
                normalized.includes('already been used') ||
                normalized.includes('duplicate') ||
                normalized.includes('unique constraint') ||
                normalized.includes('already exists');

              if (isAlreadyActiveError || isDuplicateOrUsedError) {
                const syncedState = await checkActiveSession();
                await fetchRequests();

                if (syncedState.hasActiveSession) {
                  Alert.alert('Phiên đã bắt đầu', 'Phiên sử dụng đang hoạt động và đã được đồng bộ lại trạng thái.', [
                    { text: 'OK', onPress: () => navigation.navigate('Home') },
                  ]);
                } else {
                  Alert.alert('Yêu cầu đã được sử dụng', 'Yêu cầu này đã được dùng hoặc đã xử lý trước đó. Vui lòng chọn yêu cầu khác hoặc tạo yêu cầu mới.');
                }
              } else {
                Alert.alert('Lỗi', message);
              }
            } finally {
              setStartingRequestId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <InAppNotificationBanner
        visible={!!inAppNotice}
        title={inAppNotice?.title || ''}
        message={inAppNotice?.message}
        tone={inAppNotice?.tone || 'info'}
        onDismiss={() => setInAppNotice(null)}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={styles.hero}>
        <Text style={styles.heroTitle}>Cần thêm thời gian? ⏰</Text>
        <Text style={styles.heroSubtitle}>Nói rõ lý do để phụ huynh dễ giúp bạn hơn nhé.</Text>
      </LinearGradient>

      {requestFormLocked && (
        <AppCard style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>{requestLockTitle}</Text>
          <Text style={styles.bannerText}>{requestLockText}</Text>
          <SafeButton label="Đi tới trang chủ" icon="🏠" variant="secondary" onPress={() => navigation.navigate('Home')} />
        </AppCard>
      )}

      <AppCard style={requestFormLocked ? styles.disabledCard : undefined}>
        <Text style={styles.cardTitle}>Gửi yêu cầu mới ✉️</Text>
        <Text style={styles.helperText}>Hãy điền số phút và nói ngắn gọn lý do của bạn.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Số phút muốn dùng</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 30, 60, 120..."
            value={requestedMinutes}
            onChangeText={setRequestedMinutes}
            keyboardType="numeric"
            editable={!isSubmitting && !requestFormLocked}
          />
          <Text style={styles.hint}>Tối đa 480 phút trong một yêu cầu</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Lý do</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ví dụ: Con cần học thêm hoặc xem video an toàn..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            editable={!isSubmitting && !requestFormLocked}
          />
        </View>

        <SafeButton
          label="Gửi tới phụ huynh"
          icon="✉️"
          loading={isSubmitting}
          disabled={requestFormLocked}
          onPress={handleSubmit}
        />
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử yêu cầu</Text>

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : requests.length === 0 ? (
          <AppCard>
            <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
            <Text style={styles.emptyText}>Khi bạn gửi yêu cầu, chúng sẽ xuất hiện ở đây theo dạng dòng thời gian.</Text>
          </AppCard>
        ) : (
          <View style={styles.timeline}>
            {requests.map((request) => {
              const isCurrentlyActive = hasActiveSession && activeRequestId === request.requestId;
              const isCompleted = getIsRequestCompleted(request, isCurrentlyActive);
              const canStartThisRequest =
                request.status.toLowerCase() === 'approved' &&
                !!request.approvedMinutes &&
                !hasActiveSession &&
                !isCompleted &&
                actionableApprovedRequestId !== null &&
                request.requestId === actionableApprovedRequestId;

              return (
                <View key={request.requestId} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <AppCard style={[styles.timelineCard, isCompleted && styles.completedCard]}>
                    <View style={styles.requestHeader}>
                      <Text style={styles.requestTitle}>{request.requestedMinutes} phút</Text>
                      <StatusBadge
                        label={isCompleted ? 'Đã hoàn thành' : getStatusText(request.status)}
                        tone={isCompleted ? 'info' : (getStatusTone(request.status) as 'warning' | 'success' | 'danger' | 'neutral')}
                      />
                    </View>
                    <Text style={styles.requestReason}>{request.reason}</Text>
                    {request.approvedMinutes ? <Text style={styles.requestMeta}>Được duyệt: {request.approvedMinutes} phút</Text> : null}
                    {request.parentNote ? <Text style={styles.requestMeta}>Ghi chú: {request.parentNote}</Text> : null}
                    <Text style={styles.requestTime}>{formatTime(request.createdAt)}</Text>

                    {canStartThisRequest ? (
                      <SafeButton
                        label="Start Using"
                        icon="🎮"
                        loading={startingRequestId === request.requestId}
                        onPress={() => handleStartSession(request.requestId)}
                      />
                    ) : null}

                    {isCurrentlyActive ? (
                      <View style={styles.activeIndicator}>
                        <Text style={styles.activeIndicatorText}>⏰ Phiên này đang được sử dụng</Text>
                      </View>
                    ) : null}
                  </AppCard>
                </View>
              );
            })}
          </View>
        )}
      </View>
      </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  bannerCard: {
    backgroundColor: '#FFF8E6',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  disabledCard: {
    opacity: 0.75,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: '#FBFEFD',
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  timeline: {
    gap: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 6,
  },
  timelineCard: {
    flex: 1,
    marginBottom: 12,
  },
  completedCard: {
    opacity: 0.78,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  requestTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  requestReason: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 8,
  },
  requestMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  activeIndicator: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFF8E6',
  },
  activeIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
});

export default RequestSoftScreen;
