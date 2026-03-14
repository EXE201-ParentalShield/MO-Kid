import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

const NoDeviceScreen = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Chưa có thiết bị 📱</Text>
        
        <Text style={styles.message}>
          Xin chào <Text style={styles.username}>{user?.fullName}</Text>!
        </Text>
        
        <Text style={styles.instruction}>
          Tài khoản của bạn chưa được thêm vào thiết bị nào.{'\n\n'}
          Vui lòng yêu cầu phụ huynh thêm thiết bị cho bạn từ ứng dụng Parent Shield.
        </Text>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>📋 Hướng dẫn:</Text>
          <Text style={styles.stepText}>1. Phụ huynh mở ứng dụng Parent Shield</Text>
          <Text style={styles.stepText}>2. Chọn "Thêm thiết bị"</Text>
          <Text style={styles.stepText}>3. Nhập thông tin tài khoản: <Text style={styles.bold}>{user?.username}</Text></Text>
          <Text style={styles.stepText}>4. Sau khi thêm xong, đăng nhập lại</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  username: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  instruction: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  stepsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  stepText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NoDeviceScreen;
