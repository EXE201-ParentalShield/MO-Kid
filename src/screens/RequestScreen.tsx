import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../utils/constants';

const RequestScreen = () => {
  const [appName, setAppName] = useState('');
  const [reason, setReason] = useState('');

  const requests = [
    { id: 1, app: 'Instagram', reason: 'Muốn xem ảnh của bạn bè', status: 'pending', time: '5 phút trước' },
    { id: 2, app: 'Roblox', reason: 'Chơi game với bạn', status: 'approved', time: '1 giờ trước' },
    { id: 3, app: 'TikTok', reason: 'Xem video giáo dục', status: 'denied', time: '2 giờ trước' },
  ];

  const handleSubmit = () => {
    if (!appName || !reason) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    Alert.alert('Thành công', 'Yêu cầu của bạn đã được gửi đến phụ huynh!');
    setAppName('');
    setReason('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return COLORS.success;
      case 'denied':
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'approved':
        return 'Đã duyệt';
      case 'denied':
        return 'Từ chối';
      default:
        return status;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Gửi yêu cầu mới</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên ứng dụng / Website</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Instagram, YouTube..."
              value={appName}
              onChangeText={setAppName}
            />
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
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>✉️ Gửi yêu cầu</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Lịch sử yêu cầu</Text>
          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestApp}>📱 {request.app}</Text>
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
              <Text style={styles.requestTime}>{request.time}</Text>
            </View>
          ))}
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  },
});

export default RequestScreen;
