import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Order, OrderStatus } from '@/lib/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF9C3', text: '#854D0E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  preparing: { bg: '#FED7AA', text: '#7C2D12' },
  ready: { bg: '#D1FAE5', text: '#065F46' },
  delivered: { bg: '#F0FDF4', text: '#15803D' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const colors = useColors();
  const statusStyle = STATUS_COLORS[order.status];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.orderNum, { color: colors.foreground }]}>#{order.order_number}</Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>
      <Text style={[styles.customer, { color: colors.mutedForeground }]} numberOfLines={1}>
        {order.customer?.name ?? 'Unknown customer'}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {new Date(order.order_date).toLocaleDateString()}
        </Text>
        <Text style={[styles.total, { color: colors.primary }]}>
          ${order.grand_total.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNum: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  customer: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  total: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
