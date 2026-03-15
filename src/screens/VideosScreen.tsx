import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../utils/constants';
import { getVideos, VideoItem } from '../api/videos';

type VideosScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Videos'>;
};

const VideosScreen = ({ navigation }: VideosScreenProps) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          videos.map((video) => (
            <TouchableOpacity
              key={video.videoId}
              style={styles.videoCard}
              onPress={() => navigation.navigate('WatchVideo', { video })}
            >
              <View style={styles.thumbnail}>
                {video.thumbnailUrl ? (
                  <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnailImage} />
                ) : (
                  <Text style={styles.thumbnailIcon}>🎬</Text>
                )}
              </View>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                {!!video.description && <Text style={styles.videoDesc} numberOfLines={2}>{video.description}</Text>}
                {!!video.durationSeconds && (
                  <Text style={styles.videoDuration}>
                    ⏱️ {(Math.round((video.durationSeconds || 0) / 60))} phút
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
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
