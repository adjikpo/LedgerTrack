import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [mission, setMission] = useState<{ id: string; name: string; completedToday: boolean } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/home', { token });
      setStreak(data.streak);
      setMission({ id: data.mission.id, name: data.mission.name, completedToday: data.mission.completedToday });
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onMissionComplete = async () => {
    if (!token || !mission) return;
    try {
      await apiFetch(`/api/habits/${mission.id}/complete`, { method: 'POST', token });
      await load();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Action impossible');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LedgerTrack</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="flame" size={22} color="#ef4444" />
          <Text style={styles.cardTitle}>Streak</Text>
        </View>
        <Text style={styles.streakValue}>{streak} jours</Text>
        <Text style={styles.streakHint}>{streak}/30 jours</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.greeting}>Bonjour Sophie ! 👋</Text>
        <Text style={styles.missionLabel}>Ta mission du jour</Text>
        {loading && <ActivityIndicator />}
        {mission && (
          <>
            <Text style={styles.missionText}>{mission.name}</Text>
            {!mission.completedToday ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={onMissionComplete}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Coche Fait !</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.success}>✅ Mission accomplie !</Text>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/reminder')}>
        <Ionicons name="alert" size={18} color="#0ea5e9" />
        <Text style={styles.linkBtnText}>Voir rappel urgent</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { paddingVertical: 8, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  card: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginLeft: 8 },
  streakValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  streakHint: { fontSize: 12, color: '#64748b' },
  greeting: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  missionLabel: { fontSize: 12, color: '#64748b' },
  missionText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  primaryBtn: { backgroundColor: '#0ea5e9', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  success: { color: '#16a34a', fontWeight: '700', marginTop: 8 },
  linkBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  linkBtnText: { color: '#0ea5e9', fontWeight: '600', marginLeft: 6 },
});
