import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { OrderRepository } from '@/lib/repository';
import { OrderCard } from '@/components/OrderCard';
import type { Order } from '@/lib/types';

export default function OrdersScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => OrderRepository.getAll(),
  });

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Icon name="clipboard" size={40} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No orders yet</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Create your first order to get started</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search orders..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/orders/new')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList<Order>
          data={filtered}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/orders/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
});
