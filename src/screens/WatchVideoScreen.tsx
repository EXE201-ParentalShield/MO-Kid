import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
// @ts-ignore
import YoutubePlayer from 'react-native-youtube-iframe';
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

  const embedId = normalizeYoutubeId(video.youtubeId || video.url || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl = embedId
    ? `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`
    : null;

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

  const handleThumbnailPress = () => {
    setShowPlayer(true);
    setIsPlaying(true);
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
              <TouchableOpacity style={styles.thumbnailWrapper} onPress={handleThumbnailPress} activeOpacity={0.85}>
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
              <YoutubePlayer
                ref={playerRef}
                height={220}
                play={isPlaying}
                videoId={embedId}
                initialPlayerParams={{
                  controls: true,
                  modestbranding: true,
                  fs: 1,
                }}
                webViewProps={{
                  injectedJavaScript: `
                    setTimeout(function() {
                      var video = document.querySelector('video');
                      if (video) {
                        video.requestFullscreen?.() ||
                        video.webkitRequestFullscreen?.() ||
                        video.mozRequestFullScreen?.();
                      }
                    }, 800);
                    true;
                  `,
                  allowsFullscreenVideo: true,
                  allowsInlineMediaPlayback: false,
                  mediaPlaybackRequiresUserAction: false,
                }}
                onChangeState={(state: 'playing' | 'paused' | 'ended' | 'buffering' | 'unstarted' | 'ready') => {
                  if (state === 'playing') {
                    setIsPlaying(true);
                    startWatching();
                  } else if (state === 'paused') {
                    setIsPlaying(false);
                    stopWatching();
                  } else if (state === 'ended') {
                    setIsPlaying(false);
                    stopWatching();
                  }
                }}
              />
            )}
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
  playerContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
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