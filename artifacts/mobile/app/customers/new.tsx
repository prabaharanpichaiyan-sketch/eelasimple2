import { showAlert } from '@/lib/dialog';
import React, { useState } from 'react';
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { CustomerRepository } from '@/lib/repository';

export default function NewCustomerScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error('Name is required.');
      return CustomerRepository.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        notes: notes.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      showAlert('Error', err instanceof Error ? err.message : 'Could not create customer.');
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
        {[
          { label: 'Full Name *', value: name, setter: setName, placeholder: 'Customer name', type: 'default' },
          { label: 'Phone', value: phone, setter: setPhone, placeholder: '+1 (555) 000-0000', type: 'phone-pad' },
          { label: 'Email', value: email, setter: setEmail, placeholder: 'customer@example.com', type: 'email-address' },
          { label: 'Address', value: address, setter: setAddress, placeholder: '123 Main St, City', type: 'default' },
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
            placeholder="Any special notes..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
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
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Add Customer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
