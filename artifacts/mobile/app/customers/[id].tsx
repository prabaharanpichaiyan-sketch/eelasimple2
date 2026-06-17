import { showAlert } from '@/lib/dialog';
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
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerRepository } from '@/lib/repository';

export default function CustomerDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => CustomerRepository.getById(id!),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email);
      setAddress(customer.address);
      setNotes(customer.notes);
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: () => CustomerRepository.update(id!, {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      notes: notes.trim(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      showAlert('Error', err instanceof Error ? err.message : 'Update failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => CustomerRepository.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.back();
    },
    onError: (err) => {
      showAlert('Error', err instanceof Error ? err.message : 'Delete failed.');
    },
  });

  function handleDelete() {
    if (!isOwner) {
      showAlert('Permission denied', 'Only bakery owners can delete customers.');
      return;
    }
    showAlert('Delete Customer', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (isLoading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  if (!customer) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.mutedForeground }}>Not found</Text></View>;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: 'Full Name', value: name, setter: setName, placeholder: 'Customer name', type: 'default' },
          { label: 'Phone', value: phone, setter: setPhone, placeholder: '+1 (555) 000-0000', type: 'phone-pad' },
          { label: 'Email', value: email, setter: setEmail, placeholder: 'customer@example.com', type: 'email-address' },
          { label: 'Address', value: address, setter: setAddress, placeholder: '123 Main St', type: 'default' },
        ].map((field) => (
          <View key={field.label}>
            <Text style={[styles.label, { color: colors.foreground }]}>{field.label}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={field.value}
              onChangeText={field.setter as (v: string) => void}
              keyboardType={field.type as 'default' | 'phone-pad' | 'email-address'}
              autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
            />
          </View>
        ))}
        <View>
          <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Special notes..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, updateMutation.isPending && styles.disabled]}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          activeOpacity={0.8}
        >
          {updateMutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>}
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity style={[styles.deleteBtn, { borderColor: colors.destructive }]} onPress={handleDelete} activeOpacity={0.8}>
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Customer</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  actions: { gap: 10, marginTop: 4 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  deleteBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  disabled: { opacity: 0.6 },
});
