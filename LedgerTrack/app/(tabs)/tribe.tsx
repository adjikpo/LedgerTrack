import { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface Member { id: string | number; name: string; avatar: string; streak: number; lastAction: string; kudos: number; }

export default function TribeScreen() {
  const { token } = useAuth();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<Member[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch('/api/tribe', { token });
    setMembers(data.members);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggleKudo = async (id: string | number) => {
    if (!token) return;
    const target = String(id);
    const res = await apiFetch('/api/tribe/kudos', { method: 'POST', body: { to_user: target }, token });
    const next = new Set(liked);
    if (res.liked) next.add(target); else next.delete(target);
    setLiked(next);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, kudos: m.kudos + (res.liked ? 1 : -1) } : m));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ta tribu Eau</Text>
      <Text style={styles.subtitle}>42 membres actifs 💧</Text>

      <FlatList
        contentContainerStyle={{ paddingVertical: 8 }}
        data={members}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.action}>{item.lastAction} · il y a 2h</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="flame" size={14} color="#ef4444" />
              <Text style={styles.badgeText}>{item.streak}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleKudo(item.id)} style={styles.kudoBtn}>
              <Ionicons name={liked.has(item.id) ? 'heart' : 'heart-outline'} size={18} color={liked.has(item.id) ? '#ef4444' : '#64748b'} />
              <Text style={[styles.kudoText, liked.has(item.id) && { color: '#ef4444' }]}>{item.kudos + (liked.has(item.id) ? 1 : 0)}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  action: { fontSize: 12, color: '#64748b' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#991b1b', fontWeight: '700', marginLeft: 4 },
  kudoBtn: { marginLeft: 8, flexDirection: 'row', alignItems: 'center' },
  kudoText: { color: '#64748b', fontWeight: '600', marginLeft: 4 },
});
