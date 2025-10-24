import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface Habit { id: string | number; name: string; streak: number; completed: boolean; isTodayMission?: boolean; icon?: string; }

export default function MoiScreen() {
  const { token } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch('/api/habits', { token });
    const list: Habit[] = data.habits.map((h: any) => ({ id: h.id, name: h.name, streak: h.streak, completed: h.completedToday, isTodayMission: !!h.isTodayMission }));
    setHabits(list);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const todayMission = useMemo(() => habits.find(h => h.isTodayMission), [habits]);

  const completeHabit = async (id: number | string) => {
    if (!token) return;
    await apiFetch(`/api/habits/${id}/complete`, { method: 'POST', token });
    await load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mon profil</Text>

      {todayMission && (
        <View style={styles.mission}>
          <Text style={styles.missionTitle}>Mission du jour</Text>
          <Text style={styles.missionName}>{todayMission.name}</Text>
          <Text style={styles.missionStreak}>Streak: {todayMission.streak} jours</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Mes habitudes</Text>
      <FlatList
        contentContainerStyle={{ paddingVertical: 8 }}
        data={habits}
        keyExtractor={(h) => String(h.id)}
        renderItem={({ item }) => (
          <View style={styles.habitRow}>
            <Text style={styles.habitName}>{item.name}</Text>
            <View style={styles.habitRight}>
              <View style={styles.badge}>
                <Ionicons name="flame" size={14} color="#ef4444" />
                <Text style={styles.badgeText}>{item.streak}</Text>
              </View>
              <TouchableOpacity
                disabled={item.completed}
                onPress={() => completeHabit(item.id)}
                style={[styles.doneBtn, item.completed && { opacity: 0.5 }]}>
                <Text style={styles.doneText}>{item.completed ? 'Fait' : 'Marquer fait'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  mission: { backgroundColor: '#f1f5f9', borderRadius: 14, padding: 12, marginBottom: 12 },
  missionTitle: { color: '#64748b', fontWeight: '600' },
  missionName: { color: '#0f172a', fontWeight: '700', marginTop: 4 },
  missionStreak: { color: '#0f172a', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginVertical: 8 },
  habitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, marginBottom: 8 },
  habitName: { color: '#0f172a', fontWeight: '600', flex: 1, paddingRight: 8 },
  habitRight: { flexDirection: 'row', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#991b1b', fontWeight: '700', marginLeft: 4 },
  doneBtn: { backgroundColor: '#0ea5e9', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, marginLeft: 8 },
  doneText: { color: '#fff', fontWeight: '700' },
});
