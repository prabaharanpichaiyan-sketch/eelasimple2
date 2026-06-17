import { showAlert } from '@/lib/dialog';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { OrderRepository } from '@/lib/repository';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => OrderRepository.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (status: OrderStatus) => OrderRepository.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await import('@/lib/supabase').then(m => m.supabase)
        .then(s => s.from('orders').delete().eq('id', id!));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      router.back();
    },
  });

  function handleDelete() {
    if (!isOwner) {
      showAlert('Permission denied', 'Only bakery owners can delete orders.');
      return;
    }
    showAlert('Delete Order', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.order_number}</Text>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="trash-2" size={18} color={colors.destructive} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow label="Customer" value={order.customer?.name ?? '—'} colors={colors} />
        <InfoRow label="Order Date" value={new Date(order.order_date).toLocaleDateString()} colors={colors} />
        <InfoRow label="Delivery Date" value={order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '—'} colors={colors} />
        <InfoRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} colors={colors} />
        {order.discount > 0 && <InfoRow label="Discount" value={`-$${order.discount.toFixed(2)}`} colors={colors} />}
        <InfoRow label="Grand Total" value={`$${order.grand_total.toFixed(2)}`} colors={colors} bold />
        {order.notes ? <InfoRow label="Notes" value={order.notes} colors={colors} /> : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Order Items</Text>
        {(order.items ?? []).length === 0 ? (
          <Text style={[styles.noItems, { color: colors.mutedForeground }]}>No items</Text>
        ) : (
          order.items!.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                {item.product?.name ?? 'Unknown'}
              </Text>
              <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>x{item.quantity}</Text>
              <Text style={[styles.itemTotal, { color: colors.primary }]}>${item.line_total.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Update Status</Text>
        <View style={styles.statusGrid}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                {
                  borderColor: order.status === s ? colors.primary : colors.border,
                  backgroundColor: order.status === s ? colors.primary + '18' : colors.background,
                },
              ]}
              onPress={() => updateMutation.mutate(s)}
              disabled={updateMutation.isPending}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusBtnText, { color: order.status === s ? colors.primary : colors.mutedForeground }]}>
                {STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, colors, bold }: { label: string; value: string; colors: ReturnType<typeof import('@/hooks/useColors').useColors>; bold?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  divider: { height: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  infoValue: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 2, textAlign: 'right' },
  bold: { fontFamily: 'Inter_700Bold' },
  noItems: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  itemQty: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  itemTotal: { fontSize: 14, fontFamily: 'Inter_600SemiBold', minWidth: 60, textAlign: 'right' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
