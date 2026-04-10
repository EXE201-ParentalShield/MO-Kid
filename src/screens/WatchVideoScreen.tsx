import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { logVideoWatch, normalizeYoutubeId } from '../api/videos';

type WatchVideoRouteProp = RouteProp<RootStackParamList, 'WatchVideo'>;
type WatchVideoNavProp = NativeStackNavigationProp<RootStackParamList, 'WatchVideo'>;

type Props = {
  route: WatchVideoRouteProp;
  navigation: WatchVideoNavProp;
};

const WatchVideoScreen = ({ route, navigation }: Props) => {
  const { video } = route.params;
  const embedId = normalizeYoutubeId(video.youtubeId || video.url || video.thumbnailUrl || '');

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerErrorCode, setPlayerErrorCode] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const thumbnailUrl = embedId
    ? `https://i.ytimg.com/vi/${embedId}/hqdefault.jpg`
    : null;

  const playerUrl = useMemo(() => {
    if (!embedId) return '';

    const params = [
      'autoplay=1',
      'controls=1',
      'modestbranding=1',
      'rel=0',
      'playsinline=1',
      'iv_load_policy=3',
      'cc_load_policy=0',
      'fs=1',
      'disablekb=1',
      'enablejsapi=1',
    ].join('&');

    return `https://www.youtube.com/embed/${embedId}?${params}`;
  }, [embedId]);

  const injectedHideUiScript = `
    (function() {
      const hide = function() {
        const selectors = [
          '.ytp-chrome-top',
          '.ytp-show-cards-title',
          '.ytp-watermark',
          '.ytp-impression-link',
          '.ytp-youtube-button',
          '.ytp-endscreen-content',
          '.ytp-ce-element',
          '.branding-img-container'
        ];

        selectors.forEach(function(selector) {
          document.querySelectorAll(selector).forEach(function(el) {
            el.style.display = 'none';
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
          });
        });
      };

      hide();
      setInterval(hide, 500);

      const detectError = function() {
        const errorHost = document.querySelector('.ytp-error');
        if (!errorHost) return;

        const text = (errorHost.innerText || '').trim();
        const codeMatch = text.match(/(101|102|105|150|151|152|153)/);
        const code = codeMatch ? codeMatch[1] : 'UNKNOWN';

        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'YT_PLAYER_ERROR',
            code: code,
            message: text
          }));
        }
      };

      setInterval(detectError, 700);
      true;
    })();
  `;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startWatching = () => {
    if (isWatching) return;
    setIsWatching(true);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  };

  const stopWatching = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsWatching(false);
  };

  const handleComplete = async () => {
    stopWatching();
    try {
      await logVideoWatch(video.videoId, elapsedSeconds, true);
      Alert.alert('Thành công', 'Đã ghi nhận thời gian xem video', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể ghi log xem video');
    }
  };

  const handlePlayPress = () => {
    if (!embedId) return;

    setPlayerErrorCode(null);
    setShowPlayer(true);
    setIsPlayerLoading(true);
    setIsPlayerReady(false);
    startWatching();
  };

  const handlePlayerLoaded = () => {
    setIsPlayerLoading(false);
    setIsPlayerReady(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const openInYoutubeApp = async () => {
    if (!embedId) return;
    const youtubeUrl = `https://www.youtube.com/watch?v=${embedId}`;

    try {
      await Linking.openURL(youtubeUrl);
    } catch {
      Alert.alert('Lỗi', 'Không thể mở YouTube ở thời điểm này.');
    }
  };

  const handleEmbedError = (errorCode?: string) => {
    const code = String(errorCode || '').trim() || 'UNKNOWN';
    setPlayerErrorCode(code);
    setIsPlayerLoading(false);
    setIsPlayerReady(false);
    stopWatching();

    Alert.alert(
      'Video không hỗ trợ nhúng',
      `Video này đang chặn phát nhúng (mã ${code}). Bạn có muốn mở trực tiếp trên YouTube không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mở YouTube', onPress: openInYoutubeApp },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎬 {video.title}</Text>
        {!!video.description && (
          <Text style={styles.desc}>{video.description}</Text>
        )}

        {!!embedId && (
          <View style={styles.playerContainer}>
            {!showPlayer ? (
              <TouchableOpacity style={styles.thumbnailWrapper} activeOpacity={0.92} onPress={handlePlayPress}>
                {thumbnailUrl && (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.overlay} />
                <View style={styles.playButton}>
                  <View style={styles.playTriangle} />
                </View>
                <Text style={styles.thumbnailTitle} numberOfLines={2}>
                  {video.title}
                </Text>
              </TouchableOpacity>
            ) : (
              <Animated.View style={[styles.webviewWrap, { opacity: fadeAnim }]}> 
                <WebView
                  source={{ uri: playerUrl }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  allowsFullscreenVideo
                  userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                  injectedJavaScript={injectedHideUiScript}
                  onLoadEnd={handlePlayerLoaded}
                  onMessage={(event) => {
                    try {
                      const payload = JSON.parse(event.nativeEvent.data || '{}');
                      if (payload?.type === 'YT_PLAYER_ERROR') {
                        handleEmbedError(payload?.code);
                      }
                    } catch {
                      // Ignore malformed bridge payload.
                    }
                  }}
                  onError={() => handleEmbedError('WEBVIEW')}
                  onHttpError={() => handleEmbedError('HTTP')}
                />
              </Animated.View>
            )}

            {showPlayer && (isPlayerLoading || !isPlayerReady) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            )}
          </View>
        )}

        {!embedId && (
          <View style={styles.invalidSourceCard}>
            <Text style={styles.invalidSourceTitle}>Nguồn phát không hợp lệ</Text>
            <Text style={styles.invalidSourceText}>
              Video này chưa có youtubeId hoặc URL đúng định dạng nên chưa thể phát.
            </Text>
          </View>
        )}

        {!!playerErrorCode && (
          <View style={styles.invalidSourceCard}>
            <Text style={styles.invalidSourceTitle}>Video chặn phát nhúng (mã {playerErrorCode})</Text>
            <Text style={styles.invalidSourceText}>
              Một số video YouTube không cho app bên thứ ba phát trực tiếp. Bạn có thể mở video trên YouTube để xem.
            </Text>
            <TouchableOpacity style={styles.openYoutubeBtn} onPress={openInYoutubeApp}>
              <Text style={styles.openYoutubeBtnText}>Mở trên YouTube</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.done]} onPress={handleComplete}>
            <Text style={styles.buttonText}>✅ Xem xong</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  invalidSourceCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  invalidSourceTitle: {
    color: '#92400e',
    fontWeight: '700',
    marginBottom: 4,
  },
  invalidSourceText: {
    color: '#78350f',
    fontSize: 13,
  },
  openYoutubeBtn: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  openYoutubeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  playerContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  webviewWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  thumbnailWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftWidth: 20,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#111',
    marginLeft: 4,
  },
  thumbnailTitle: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  buttons: { gap: 12 },
  button: { padding: 12, borderRadius: 10, alignItems: 'center' },
  done: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default WatchVideoScreen;