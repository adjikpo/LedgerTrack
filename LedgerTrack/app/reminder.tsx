import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

function useCountdown(startMs: number) {
  const [ms, setMs] = useState(startMs);
  useEffect(() => {
    const id = setInterval(() => setMs((v) => Math.max(0, v - 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const parts = useMemo(() => {
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return { h, m, s };
  }, [ms]);
  return parts;
}

export default function UrgentReminderScreen() {
  const { h, m, s } = useCountdown(2 * 60 * 60 * 1000 - 1000);
  const { token } = useAuth();
  const [saved, setSaved] = useState(false);
  const [mission, setMission] = useState<{ id: string; name: string } | null>(null);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const data = await apiFetch('/api/home', { token });
      setMission({ id: data.mission.id, name: data.mission.name });
      setStreak(data.streak);
    })();
  }, [token]);

  const saveStreak = async () => {
    if (!token || !mission) return;
    await apiFetch(`/api/habits/${mission.id}/complete`, { method: 'POST', token });
    setSaved(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.alertHeader}>
        <Ionicons name="alert" size={18} color="#fff" />
        <Text style={styles.alertText}>ALERTE URGENTE</Text>
      </View>
      <Text style={styles.subtitle}>Ton streak meurt dans</Text>
      <Text style={styles.timer}>{String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</Text>

      <View style={styles.streakCard}>
        <Ionicons name="flame" size={18} color="#ef4444" />
        <Text style={styles.streakText}>{streak} jours</Text>
      </View>

      <View style={styles.mission}>
        <Text style={styles.missionTitle}>Ta mission du jour</Text>
        <Text style={styles.missionName}>{mission?.name ?? '...'}</Text>
      </View>

      {!saved ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={saveStreak}>
          <Text style={styles.primaryBtnText}>Sauver mon streak !</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.success}>🎉 Sauvé !</Text>
      )}

      <TouchableOpacity style={styles.secondaryBtn}>
        <Text style={styles.secondaryBtnText}>Demain (perd le streak)</Text>
      </TouchableOpacity>

      <Text style={styles.warn}>⚠️ Si tu ne complètes pas maintenant, tu perds tout !</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fee2e2', padding: 16 },
  alertHeader: { backgroundColor: '#ef4444', paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'center', borderRadius: 999, flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  alertText: { color: '#fff', fontWeight: '800', letterSpacing: 1, marginLeft: 6 },
  subtitle: { textAlign: 'center', color: '#7f1d1d', marginTop: 8 },
  timer: { textAlign: 'center', fontSize: 36, fontWeight: '900', color: '#7f1d1d', marginTop: 8 },
  streakCard: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  streakText: { color: '#7f1d1d', fontWeight: '800', marginLeft: 6 },
  mission: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginTop: 8 },
  missionTitle: { color: '#64748b', fontWeight: '600' },
  missionName: { color: '#0f172a', fontWeight: '700', marginTop: 4 },
  primaryBtn: { backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { color: '#7f1d1d', fontWeight: '700' },
  warn: { textAlign: 'center', color: '#7f1d1d', marginTop: 8 },
  success: { textAlign: 'center', color: '#16a34a', fontWeight: '800', marginTop: 8 },
});
