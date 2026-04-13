import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { getVideos, normalizeYoutubeId, VideoItem } from '../api/videos';

type VideosScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Videos'>;
};

const VideosScreen = ({ navigation }: VideosScreenProps) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailAttemptIndex, setThumbnailAttemptIndex] = useState<Record<string, number>>({});

  const getVideoStableKey = (video: VideoItem, index: number): string => {
    return String(video.videoId || video.youtubeId || video.url || video.title || index);
  };

  const formatDurationLabel = (seconds?: number): string | null => {
    const safeSeconds = Number(seconds || 0);
    if (!Number.isFinite(safeSeconds) || safeSeconds <= 0) return null;
    if (safeSeconds > 6 * 3600) return null;

    const mins = Math.max(1, Math.round(safeSeconds / 60));
    return `${mins} phút`;
  };

  const getThumbnailCandidates = (video: VideoItem): string[] => {
    const candidates: string[] = [];

    if (video.thumbnailUrl) {
      candidates.push(video.thumbnailUrl.trim());
    }

    const youtubeId = normalizeYoutubeId(video.youtubeId || video.url || '');
    if (youtubeId) {
      candidates.push(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`);
      candidates.push(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);
      candidates.push(`https://i3.ytimg.com/vi/${youtubeId}/hqdefault.jpg`);
      candidates.push(`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`);
      candidates.push(`https://img.youtube.com/vi/${youtubeId}/0.jpg`);
    }

    // Final guaranteed fallback so cards never end up without an image.
    candidates.push('https://placehold.co/320x180/e5e7eb/374151?text=Video');

    const unique = Array.from(new Set(candidates.filter(Boolean)));
    return unique.filter((url) => /^https?:\/\//i.test(url));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await getVideos();
        setVideos(data);
      } catch (e: any) {
        setError(e.message || 'Không thể tải danh sách video');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const openVideo = (video: VideoItem) => {
    const playableId = normalizeYoutubeId(video.youtubeId || video.url || video.thumbnailUrl || '');
    if (!playableId) {
      Alert.alert('Video chưa sẵn sàng', 'Video này đang thiếu nguồn phát hợp lệ. Vui lòng cập nhật lại youtubeId hoặc URL video.');
      return;
    }

    navigation.navigate('WatchVideo', { video: { ...video, youtubeId: playableId } });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎥 Video an toàn cho trẻ em</Text>
        <Text style={styles.subtitle}>{videos.length} video</Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : videos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Chưa có video</Text>
          </View>
        ) : (
          videos.map((video, index) => {
            const stableKey = getVideoStableKey(video, index);
            const candidates = getThumbnailCandidates(video);
            const attempt = thumbnailAttemptIndex[stableKey] || 0;
            const currentThumb = candidates[attempt];
            const durationLabel = formatDurationLabel(video.durationSeconds);

            return (
            <TouchableOpacity
              key={stableKey}
              style={styles.videoCard}
              onPress={() => openVideo(video)}
            >
              <View style={styles.thumbnail}>
                {!currentThumb ? (
                  <Text style={styles.thumbnailIcon}>🎬</Text>
                ) : (
                  <Image
                    source={{ uri: currentThumb }}
                    style={styles.thumbnailImage}
                    onError={() => {
                      setThumbnailAttemptIndex((prev) => ({
                        ...prev,
                        [stableKey]: (prev[stableKey] || 0) + 1,
                      }));
                    }}
                  />
                )}
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                {!!video.description && <Text style={styles.videoDesc} numberOfLines={2}>{video.description}</Text>}
                {!!durationLabel && (
                  <Text style={styles.videoDuration}>
                    ⏱️ {durationLabel}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
          })
        )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorCard: {
    padding: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 96,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailIcon: {
    fontSize: 28,
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  videoDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  videoDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});

export default VideosScreen;
