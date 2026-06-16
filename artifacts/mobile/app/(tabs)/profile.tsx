import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, type IconName } from '@/components/Icon';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';

interface RowProps {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function Row({ icon, label, value, onPress, destructive = false }: RowProps) {
  const colors = useColors();
  const color = destructive ? colors.destructive : colors.foreground;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: (destructive ? colors.destructive : colors.primary) + '18' }]}>
        <Icon name={icon} size={16} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      {onPress && !destructive && <Icon name="chevron-right" size={16} color={colors.mutedForeground} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const { profile, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await signOut();
          },
        },
      ]
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>
          {profile?.full_name ?? 'Unknown'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {profile?.role === 'owner' ? 'Bakery Owner' : 'Staff'}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row icon="mail" label="Email" value={profile?.email} />
        <Row icon="shield" label="Role" value={profile?.role === 'owner' ? 'Bakery Owner' : 'Staff'} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Row icon="log-out" label="Sign Out" onPress={handleSignOut} destructive />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { color: '#fff', fontSize: 28, fontFamily: 'Inter_700Bold' },
  userName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  rowValue: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});
