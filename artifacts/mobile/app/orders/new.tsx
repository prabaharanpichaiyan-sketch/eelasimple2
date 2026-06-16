import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { CustomerRepository, OrderRepository, ProductRepository } from '@/lib/repository';
import type { Customer, Product } from '@/lib/types';

interface CartItem { product: Product; quantity: number }

export default function NewOrderScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [showCustomers, setShowCustomers] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: () => CustomerRepository.getAll() });
  const { data: products = [] } = useQuery({ queryKey: ['products-active'], queryFn: () => ProductRepository.getAll() });

  const subtotal = cart.reduce((sum, ci) => sum + ci.product.price * ci.quantity, 0);
  const discountAmt = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountAmt);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.product.id === product.id);
      if (existing) return prev.map((ci) => ci.product.id === product.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { product, quantity: 1 }];
    });
    setShowProducts(false);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((ci) => ci.product.id !== productId));
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev
      .map((ci) => ci.product.id === productId ? { ...ci, quantity: Math.max(1, ci.quantity + delta) } : ci));
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error('Please select a customer.');
      if (cart.length === 0) throw new Error('Add at least one item.');
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
      const order = await OrderRepository.create({
        order_number: orderNum,
        customer_id: selectedCustomer.id,
        order_date: new Date().toISOString(),
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
        subtotal,
        discount: discountAmt,
        grand_total: grandTotal,
        notes,
      });
      await Promise.all(cart.map((ci) =>
        OrderRepository.addItem({
          order_id: order.id,
          product_id: ci.product.id,
          quantity: ci.quantity,
          price: ci.product.price,
          line_total: ci.product.price * ci.quantity,
        })
      ));
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create order.');
    },
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer</Text>
        <TouchableOpacity
          style={[styles.picker, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={() => setShowCustomers(!showCustomers)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerText, { color: selectedCustomer ? colors.foreground : colors.mutedForeground }]}>
            {selectedCustomer?.name ?? 'Select a customer...'}
          </Text>
          <Feather name={showCustomers ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        {showCustomers && (
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => { setSelectedCustomer(c); setShowCustomers(false); }}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Items</Text>
          <TouchableOpacity onPress={() => setShowProducts(!showProducts)} activeOpacity={0.7}>
            <Feather name="plus-circle" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {showProducts && (
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => addToCart(p)}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>{p.name}</Text>
                <Text style={[styles.dropdownPrice, { color: colors.primary }]}>${p.price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {cart.map((ci) => (
          <View key={ci.product.id} style={styles.cartItem}>
            <Text style={[styles.cartName, { color: colors.foreground }]} numberOfLines={1}>{ci.product.name}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => updateQty(ci.product.id, -1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                <Feather name="minus" size={14} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.foreground }]}>{ci.quantity}</Text>
              <TouchableOpacity onPress={() => updateQty(ci.product.id, 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                <Feather name="plus" size={14} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.cartTotal, { color: colors.primary }]}>${(ci.product.price * ci.quantity).toFixed(2)}</Text>
            <TouchableOpacity onPress={() => removeFromCart(ci.product.id)}>
              <Feather name="x" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
        {cart.length === 0 && <Text style={[styles.emptyCart, { color: colors.mutedForeground }]}>No items added yet</Text>}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
        <View>
          <Text style={[styles.label, { color: colors.foreground }]}>Delivery Date (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="2025-01-01"
            placeholderTextColor={colors.mutedForeground}
            value={deliveryDate}
            onChangeText={setDeliveryDate}
          />
        </View>
        <View>
          <Text style={[styles.label, { color: colors.foreground }]}>Discount ($)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            value={discount}
            onChangeText={setDiscount}
            keyboardType="decimal-pad"
          />
        </View>
        <View>
          <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Special requests..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: colors.foreground }]}>${subtotal.toFixed(2)}</Text>
        </View>
        {discountAmt > 0 && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Discount</Text>
            <Text style={[styles.totalValue, { color: colors.destructive }]}>-${discountAmt.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={[styles.grandTotalLabel, { color: colors.foreground }]}>Grand Total</Text>
          <Text style={[styles.grandTotalValue, { color: colors.primary }]}>${grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.primary }, createMutation.isPending && styles.disabled]}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending}
        activeOpacity={0.8}
      >
        {createMutation.isPending ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Create Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  dropdownPrice: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartName: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 26, height: 26, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', minWidth: 20, textAlign: 'center' },
  cartTotal: { fontSize: 13, fontFamily: 'Inter_600SemiBold', minWidth: 55, textAlign: 'right' },
  emptyCart: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  grandTotalRow: { marginTop: 4, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  totalLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  totalValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  grandTotalLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  grandTotalValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
