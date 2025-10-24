import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide';
    if (password.length < 8) e.password = '8 caractères minimum';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await login(email, password);
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Connexion échouée', err?.message || 'Vérifiez vos identifiants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Se connecter</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="nom@exemple.com"
        />
        {!!errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />
        {!!errors.password && <Text style={styles.error}>{errors.password}</Text>}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0ea5e9' },
  card: { width: '100%', maxWidth: 420, backgroundColor: 'white', borderRadius: 16, padding: 20, gap: 8, elevation: 2 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 12 },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 12, borderRadius: 10, marginTop: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
