import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
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
import { COLORS, STORAGE_KEYS } from '../utils/constants';
import { createAccessRequest, getMyRequests, AccessRequest } from '../api/requests';
import { startSession } from '../api/device';
import { RootStackParamList } from '../navigation/AppNavigator';

type RequestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Request'>;

const RequestScreen = () => {
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

  const checkActiveSession = useCallback(async () => {
    try {
      const sessionId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      const approvedMinutesStr = await AsyncStorage.getItem('sessionApprovedMinutes');
      const requestIdStr = await AsyncStorage.getItem('sessionRequestId');
      
      if (sessionId) {
        setHasActiveSession(true);
        setSessionApprovedMinutes(approvedMinutesStr ? parseInt(approvedMinutesStr) : 0);
        setActiveRequestId(requestIdStr ? parseInt(requestIdStr) : null);
      } else {
        setHasActiveSession(false);
        setSessionApprovedMinutes(0);
        setActiveRequestId(null);
      }
      
      // Load completed request IDs
      console.log('[RequestScreen] Loading completed request IDs...');
      const completedIdsStr = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS);
      console.log('[RequestScreen] Raw completed IDs string from AsyncStorage:', completedIdsStr);
      const completedIds = completedIdsStr ? JSON.parse(completedIdsStr) : [];
      setCompletedRequestIds(completedIds);
      console.log('[RequestScreen] Loaded completed IDs:', completedIds);
      console.log('[RequestScreen] Storage key used:', STORAGE_KEYS.COMPLETED_REQUEST_IDS);
    } catch (error) {
      console.error('[RequestScreen] Error checking session:', error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyRequests();
      setRequests(data);
    } catch (error: any) {
      console.error('[RequestScreen] Error fetching requests:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await checkActiveSession();
        await fetchRequests();
      };
      loadData();
    }, [checkActiveSession, fetchRequests])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await checkActiveSession();
    await fetchRequests();
  };

  const handleSubmit = async () => {
    const minutes = parseInt(requestedMinutes);
    
    if (!requestedMinutes || isNaN(minutes) || minutes <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số phút hợp lệ (lớn hơn 0)');
      return;
    }

    if (minutes > 480) {
      Alert.alert('Lỗi', 'Số phút không được vượt quá 480 (8 giờ)');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createAccessRequest(minutes, reason.trim());
      
      Alert.alert('Thành công', 'Yêu cầu của bạn đã được gửi đến phụ huynh!');
      setRequestedMinutes('');
      setReason('');
      
      // Refresh list
      await fetchRequests();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return COLORS.success;
      case 'rejected':
      case 'denied':
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
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

  const handleStartSession = async (requestId: number) => {
    // Find the request to get approved minutes
    const request = requests.find(r => r.requestId === requestId);
    if (!request || !request.approvedMinutes) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin yêu cầu');
      return;
    }

    Alert.alert(
      'Bắt đầu phiên sử dụng',
      `Bạn muốn bắt đầu sử dụng thiết bị với ${request.approvedMinutes} phút được phê duyệt?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu',
          onPress: async () => {
            setStartingRequestId(requestId);
            try {
              const response = await startSession(requestId);
              const sessionId = response.data.usageSessionId;
              const sessionStartTime = new Date().toISOString();
              
              // Save session info to AsyncStorage
              await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, sessionId.toString());
              await AsyncStorage.setItem('sessionStartTime', sessionStartTime);
              await AsyncStorage.setItem('sessionRequestId', requestId.toString());
              await AsyncStorage.setItem('sessionApprovedMinutes', (request.approvedMinutes || 0).toString());
              
              // Update local state immediately
              await checkActiveSession();
              
              Alert.alert(
                'Thành công! 🎉',
                `Phiên sử dụng đã bắt đầu. Bạn có ${request.approvedMinutes} phút. Chúc bạn học tập vui vẻ!`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Home')
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể bắt đầu phiên sử dụng');
            } finally {
              setStartingRequestId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <ScrollView 
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {hasActiveSession && (
          <View style={styles.activeSessionBanner}>
            <Text style={styles.bannerIcon}>⏰</Text>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Đang trong thời gian sử dụng</Text>
              <Text style={styles.bannerText}>
                Bạn có {sessionApprovedMinutes} phút được duyệt. Vui lòng kết thúc phiên trước khi gửi yêu cầu mới.
              </Text>
              <TouchableOpacity
                style={styles.goToHomeButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.goToHomeButtonText}>🏠 Đi đến trang chủ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={[styles.formCard, hasActiveSession && styles.formCardDisabled]}>
          <Text style={styles.formTitle}>Gửi yêu cầu mới</Text>
          
          {hasActiveSession && (
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>🔒 Không thể gửi yêu cầu trong khi có phiên đang chạy</Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số phút muốn sử dụng</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 30, 60, 120..."
              value={requestedMinutes}
              onChangeText={setRequestedMinutes}
              keyboardType="numeric"
              editable={!isSubmitting && !hasActiveSession}
            />
            <Text style={styles.hint}>Tối đa 480 phút (8 giờ)</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lý do bạn muốn sử dụng</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nói cho phụ huynh biết tại sao bạn cần..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              editable={!isSubmitting && !hasActiveSession}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, (isSubmitting || hasActiveSession) && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting || hasActiveSession}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>✉️ Gửi yêu cầu</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Lịch sử yêu cầu ({requests.length})</Text>
          
          {isLoading && !isRefreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
              <Text style={styles.emptySubtext}>Tạo yêu cầu đầu tiên ở trên nhé!</Text>
            </View>
          ) : (
            requests.map((request) => {
              const isCompleted = completedRequestIds.includes(request.requestId);
              const isCurrentlyActive = hasActiveSession && activeRequestId === request.requestId;
              
              if (isCompleted) {
                console.log('[RequestScreen] Request marked as completed:', request.requestId);
              }
              
              return (
              <View 
                key={request.requestId} 
                style={[
                  styles.requestCard,
                  isCompleted && styles.requestCardCompleted
                ]}
              >
                {isCompleted && (
                  <View style={styles.completedOverlay}>
                    <Text style={styles.completedBadge}>🏁 Đã hoàn thành</Text>
                  </View>
                )}
                <View style={styles.requestHeader}>
                  <Text style={styles.requestApp}>⏱️ {request.requestedMinutes} phút</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(request.status)}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {getStatusText(request.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestReason}>"{request.reason}"</Text>
                {request.approvedMinutes && (
                  <Text style={styles.approvedMinutes}>
                    ✓ Được duyệt: {request.approvedMinutes} phút
                  </Text>
                )}
                {request.parentNote && (
                  <Text style={styles.parentNote}>
                    💬 Ghi chú: {request.parentNote}
                  </Text>
                )}
                <Text style={styles.requestTime}>{formatTime(request.createdAt)}</Text>
                
                {request.status.toLowerCase() === 'approved' && request.approvedMinutes && !hasActiveSession && !isCompleted && (
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      startingRequestId === request.requestId && styles.startButtonDisabled
                    ]}
                    onPress={() => handleStartSession(request.requestId)}
                    disabled={startingRequestId === request.requestId}
                  >
                    {startingRequestId === request.requestId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.startButtonText}>🎮 Bắt đầu sử dụng</Text>
                    )}
                  </TouchableOpacity>
                )}
                
                {isCurrentlyActive && (
                  <View style={styles.activeSessionIndicator}>
                    <Text style={styles.activeSessionText}>⏰ Đang trong thời gian sử dụng</Text>
                  </View>
                )}
              </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  formCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  approvedMinutes: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 4,
  },
  parentNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  historySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  requestCardCompleted: {
    opacity: 0.6,
    backgroundColor: '#f9fafb',
  },
  completedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  completedBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestApp: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestReason: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  requestTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: COLORS.success,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeSessionIndicator: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  activeSessionText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  activeSessionBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
    marginBottom: 12,
  },
  goToHomeButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  goToHomeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formCardDisabled: {
    opacity: 0.5,
    position: 'relative',
  },
  disabledOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
    padding: 20,
  },
  disabledText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default RequestScreen;
