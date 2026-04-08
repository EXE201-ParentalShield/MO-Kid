import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const validateField = (field: 'username' | 'password', value: string) => {
    let error = '';
    
    if (field === 'username') {
      if (!value.trim()) {
        error = 'Tên đăng nhập không được để trống';
      } else if (value.length < 3) {
        error = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      } else if (value.length > 50) {
        error = 'Tên đăng nhập không được quá 50 ký tự';
      }
    } else if (field === 'password') {
      if (!value) {
        error = 'Mật khẩu không được để trống';
      } else if (value.length < 6) {
        error = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  const validateForm = () => {
    const usernameValid = validateField('username', username);
    const passwordValid = validateField('password', password);
    return usernameValid && passwordValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      Alert.alert('Thành công', 'Đăng nhập thành công!');
    } catch (error: any) {
      // Show API error message
      const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrors(prev => ({ ...prev, password: errorMessage }));
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd, '#FFFFFF']}
      locations={[0, 0.5, 1]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoGlow} />
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Parental Shield</Text>
            <Text style={styles.subtitle}>Đăng nhập tài khoản trẻ em</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) validateField('username', text);
                }}
                onBlur={() => validateField('username', username)}
                autoCapitalize="none"
                editable={!isLoading}
              />
              {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) validateField('password', text);
                  }}
                  onBlur={() => validateField('password', password)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.glow,
    opacity: 0.4,
  },
  logo: {
    width: 100,
    height: 100,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    opacity: 1,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingRight: 52,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: COLORS.text,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(255, 240, 240, 0.95)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
