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
import { ProductRepository } from '@/lib/repository';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

export default function ProductsScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => ProductRepository.getAllIncludingInactive(),
  });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Icon name="package" size={40} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add your first product to the menu</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search products..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/products/new')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList<Product>
          data={filtered}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => router.push(`/products/${item.id}`)} />
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
  row: { justifyContent: 'space-between' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 260 },
});
