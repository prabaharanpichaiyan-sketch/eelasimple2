import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/Icon';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { ProductRepository } from '@/lib/repository';

export default function ProductDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => ProductRepository.getById(id!),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setDescription(product.description);
      setPrice(product.price.toString());
      setImageUrl(product.image_url);
      setIsActive(product.is_active);
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: () => ProductRepository.update(id!, {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: parseFloat(price),
      image_url: imageUrl.trim(),
      is_active: isActive,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      queryClient.invalidateQueries({ queryKey: ['products-active'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (err) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => ProductRepository.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      queryClient.invalidateQueries({ queryKey: ['products-active'] });
      router.back();
    },
    onError: (err) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed.');
    },
  });

  function handleDelete() {
    if (!isOwner) {
      Alert.alert('Permission denied', 'Only bakery owners can delete products.');
      return;
    }
    Alert.alert('Delete Product', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!product) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.mutedForeground }}>Not found</Text></View>;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.heroImage, { borderColor: colors.border }]} />
      ) : (
        <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Icon name="package" size={40} color={colors.mutedForeground} />
        </View>
      )}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: 'Product Name', value: name, setter: setName, placeholder: 'Product name' },
          { label: 'Category', value: category, setter: setCategory, placeholder: 'Category' },
          { label: 'Price ($)', value: price, setter: setPrice, placeholder: '0.00', numeric: true },
          { label: 'Image URL', value: imageUrl, setter: setImageUrl, placeholder: 'https://...' },
        ].map((field) => (
          <View key={field.label}>
            <Text style={[styles.label, { color: colors.foreground }]}>{field.label}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={field.value}
              onChangeText={field.setter}
              keyboardType={field.numeric ? 'decimal-pad' : 'default'}
            />
          </View>
        ))}
        <View>
          <Text style={[styles.label, { color: colors.foreground }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground }]}
            placeholder="Description..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.foreground }]}>Active</Text>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
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
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: colors.destructive }]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Product</Text>
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
  heroImage: { width: '100%', height: 200, borderRadius: 14, borderWidth: 1, resizeMode: 'cover' },
  heroPlaceholder: { width: '100%', height: 160, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { gap: 10, marginTop: 4 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  deleteBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5 },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  disabled: { opacity: 0.6 },
});
