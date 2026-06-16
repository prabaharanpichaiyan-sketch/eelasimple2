import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { OrderRepository } from '@/lib/repository';
import { StatCard } from '@/components/StatCard';

export default function DashboardScreen() {
  const colors = useColors();
  const { profile } = useAuth();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => OrderRepository.getDashboardStats(),
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.mutedForeground }]}>Good morning</Text>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {profile?.full_name ?? 'Chef'} 👋
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Orders"
              value={String(stats?.total_orders ?? 0)}
              icon={<Feather name="shopping-bag" size={18} color={colors.primary} />}
              color={colors.primary + '18'}
            />
            <StatCard
              label="Monthly Revenue"
              value={`$${(stats?.monthly_revenue ?? 0).toFixed(0)}`}
              icon={<Feather name="dollar-sign" size={18} color="#16A34A" />}
              color="#16A34A18"
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              label="Pending Deliveries"
              value={String(stats?.pending_deliveries ?? 0)}
              icon={<Feather name="truck" size={18} color="#D97706" />}
              color="#D9770618"
            />
          </View>

          {(stats?.top_products?.length ?? 0) > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Products</Text>
              {stats!.top_products.map((p, i) => (
                <View key={p.name} style={styles.rankRow}>
                  <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>#{i + 1}</Text>
                  <Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.rankValue, { color: colors.primary }]}>{p.count} sold</Text>
                </View>
              ))}
            </View>
          )}

          {(stats?.top_customers?.length ?? 0) > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Customers</Text>
              {stats!.top_customers.map((c, i) => (
                <View key={c.name} style={styles.rankRow}>
                  <Text style={[styles.rankNum, { color: colors.mutedForeground }]}>#{i + 1}</Text>
                  <Text style={[styles.rankName, { color: colors.foreground }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={[styles.rankValue, { color: colors.primary }]}>${c.total.toFixed(0)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  greeting: { marginBottom: 20 },
  greetingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankNum: { fontSize: 13, fontFamily: 'Inter_500Medium', width: 28 },
  rankName: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  rankValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
