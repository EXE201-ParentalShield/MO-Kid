# Shield Family Kid App

Ứng dụng React Native dành cho trẻ em với các tính năng bảo vệ và giới hạn an toàn.

## 🚀 Tính năng

### Đã hoàn thành
- ✅ Splash screen thân thiện
- ✅ Đăng nhập bằng PIN 4 chữ số
- ✅ Trang chủ hiển thị thời gian sử dụng
- ✅ Danh sách ứng dụng được phép
- ✅ Hồ sơ cá nhân với mẹo an toàn
- ✅ Gửi yêu cầu truy cập đến phụ huynh
- ✅ Màn hình bị chặn

### Sắp tới
- 🔄 Tích hợp API thực tế
- 🔄 Countdown timer cho giới hạn thời gian
- 🔄 Game giáo dục
- 🔄 Reward system
- 🔄 Video an toàn

## 📱 Cấu trúc dự án

```
shield-kid-app/
├── src/
│   ├── screens/           # Các màn hình chính
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── AppsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── RequestScreen.tsx
│   │   └── BlockedScreen.tsx
│   ├── navigation/        # React Navigation
│   │   └── AppNavigator.tsx
│   ├── contexts/          # Context API
│   │   └── AuthContext.tsx
│   ├── components/        # Reusable components
│   └── utils/            # Utilities và constants
│       ├── constants.ts
│       └── storage.ts
├── App.tsx
└── package.json
```

## 🛠️ Cài đặt

### Yêu cầu
- Node.js 18+
- npm hoặc yarn
- Expo CLI
- Android Studio (cho Android)
- Xcode (cho iOS - chỉ trên macOS)

### Các bước cài đặt

1. **Cài đặt dependencies:**
```bash
cd shield-kid-app
npm install
```

2. **Chạy trên Development:**
```bash
npm start
```

3. **Chạy trên Android:**
```bash
npm run android
```

4. **Chạy trên iOS (chỉ macOS):**
```bash
npm run ios
```

5. **Chạy trên Web:**
```bash
npm run web
```

## 🔧 Configuration

### Android
- Package name: `com.shieldfamily.kid`
- Permissions: INTERNET, ACCESS_NETWORK_STATE (minimal permissions)
- Min SDK: 21
- Target SDK: 34

### iOS
- Bundle ID: `com.shieldfamily.kid`
- Deployment Target: iOS 13.0+

## 📦 Dependencies chính

- **React Navigation** - Navigation framework
- **React Query** - Data fetching và caching
- **AsyncStorage** - Local storage
- **Expo** - Development platform

## 🎨 Design System

### Colors
- Primary: `#10b981` (Green - Kid friendly)
- Success: `#059669` (Dark Green)
- Danger: `#dc2626` (Red)
- Warning: `#f59e0b` (Orange)
- Background: `#f0fdf4` (Light Green)

### UI/UX Principles
- Giao diện thân thiện, vui nhộn cho trẻ em
- Màu sắc tươi sáng, dễ nhìn
- Icon lớn, dễ nhấn
- Ngôn ngữ đơn giản, dễ hiểu

## 🔐 Authentication

Sử dụng PIN 4 chữ số thay vì password:
- An toàn hơn cho trẻ em
- Dễ nhớ
- Nhanh chóng

**Test PIN:** 1234 (hoặc bất kỳ 4 chữ số nào)

**TODO:** Tích hợp với API backend và Parent app

## 📱 Testing

```bash
# Test login flow
PIN: 1234

# Test features
- Home: Kiểm tra thời gian sử dụng
- Apps: Xem danh sách ứng dụng an toàn
- Profile: Thông tin và mẹo an toàn
- Request: Gửi yêu cầu truy cập
- Blocked: Màn hình khi bị chặn
```

## 🛡️ Safety Features

### Đã implement
- ✅ Giới hạn thời gian sử dụng
- ✅ Danh sách ứng dụng được phép
- ✅ Mẹo an toàn trực tuyến
- ✅ Yêu cầu phê duyệt từ phụ huynh

### Planning
- 🔄 Content filtering
- 🔄 Safe search
- 🔄 Screen time alerts
- 🔄 Break reminders
- 🔄 Educational content

## 🚀 Build Production

### Android APK
```bash
expo build:android
```

### iOS IPA (requires Apple Developer Account)
```bash
expo build:ios
```

### EAS Build (recommended)
```bash
npm install -g eas-cli
eas build --platform android
```

## 📝 Notes

- App được tối ưu cho Android trước
- Giao diện thân thiện với trẻ em
- Tối thiểu permissions để bảo vệ privacy
- Sử dụng mock data cho development
- UI/UX được thiết kế an toàn và vui nhộn

## 🎮 Kid-Friendly Features

- 🎨 Màu sắc tươi sáng
- 😊 Emoji và icon sinh động
- 📊 Progress bars trực quan
- 🎉 Feedback tích cực
- 🛡️ Luôn cảm thấy an toàn

## 🤝 Contributing

1. Clone repo
2. Tạo branch mới: `git checkout -b feature/TenTinhNang`
3. Commit: `git commit -m 'Thêm tính năng X'`
4. Push: `git push origin feature/TenTinhNang`
5. Tạo Pull Request

## 📄 License

MIT License - Shield Family © 2026

## 👨‍💻 Author

Shield Family Team

---

**Made with ❤️ for kids' online safety**
