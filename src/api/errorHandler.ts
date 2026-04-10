// Shield Kid App - Error Handler
import { AxiosError } from 'axios';

export const handleApiError = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Extract message from response (handle both camelCase and PascalCase)
    let message = data?.message || data?.Message || '';
    
    // Translate common BE error messages to Vietnamese
    const translations: Record<string, string> = {
      'Invalid credentials': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'Invalid username or password': 'Tên đăng nhập hoặc mật khẩu không đúng',
      'Invalid password': 'Mật khẩu không đúng',
      'Invalid username': 'Tên đăng nhập không đúng',
      'Account not found': 'Không tìm thấy tài khoản',
      'Device not found': 'Không tìm thấy thiết bị',
      'Device is locked': 'Thiết bị đang bị khóa',
      'Device already registered': 'Thiết bị đã được đăng ký',
    };
    
    // Check if message needs translation
    if (message && translations[message]) {
      message = translations[message];
    }

    switch (status) {
      case 400:
        return message || 'Yêu cầu không hợp lệ';
      case 401:
        return message || 'Phiên đăng nhập đã hết hạn';
      case 403:
        return 'Không có quyền truy cập';
      case 404:
        return 'Không tìm thấy dữ liệu';
      case 500:
        return 'Lỗi máy chủ. Vui lòng thử lại sau';
      default:
        return message || 'Có lỗi xảy ra';
    }
  }

  if (error.request) {
    return 'Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng';
  }

  return error.message || 'Lỗi không xác định';
};

export const logError = (error: any, context: string) => {
  if (!__DEV__) {
    console.error(`[${context}]`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};
