import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, RefreshControl, Alert, Modal, ScrollView,
} from 'react-native';
import api from '@/lib/api';

interface UserItem {
  id: number;
  name: string;
  username: string;
  email: string;
  schoolRole: string;
  userId?: string;
  gender?: string;
  phoneNumber?: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#f59e0b',
  TEACHER: '#3b82f6',
  STUDENT: '#10b981',
};

export default function UsersScreen() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'STUDENT', gender: '', phoneNumber: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      const mapped = res.data.map((u: any) => ({
        ...u,
        name: u.username || u.name || 'Unknown',
        schoolRole: u.schoolRole || u.role?.name || 'STUDENT',
      }));
      setUsers(mapped);
    } catch (e) {
      console.error('[Users] fetch:', e);
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Validation', 'Name, email, and password are required.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', { ...form });
      Alert.alert('Success', 'User created successfully.');
      setIsCreateOpen(false);
      setForm({ name: '', email: '', password: '', role: 'STUDENT', gender: '', phoneNumber: '' });
      fetchUsers();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error?.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    Alert.alert('Confirm Delete', `Delete user "${userName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/users/${userId}`);
            fetchUsers();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete user.');
          }
        }
      },
    ]);
  };

  const filtered = users.filter(u => {
    const nameMatch = (u.name || '').toLowerCase().includes(search.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(search.toLowerCase());
    const roleMatch = roleFilter === 'ALL' || u.schoolRole === roleFilter;
    return (nameMatch || emailMatch) && roleMatch;
  });

  const renderUser = ({ item }: { item: UserItem }) => (
    <View style={styles.userCard}>
      <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.schoolRole] + '22' }]}>
        <Text style={[styles.avatarText, { color: ROLE_COLORS[item.schoolRole] }]}>
          {(item.name || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.userId && <Text style={styles.userId}>ID: {item.userId}</Text>}
      </View>
      <View style={styles.userRight}>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.schoolRole] + '22' }]}>
          <Text style={[styles.roleText, { color: ROLE_COLORS[item.schoolRole] }]}>
            {item.schoolRole}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteUser(item.id, item.name)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search + Filter */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {['ALL', 'ADMIN', 'TEACHER', 'STUDENT'].map(role => (
            <TouchableOpacity
              key={role}
              style={[styles.filterChip, roleFilter === role && styles.filterChipActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreateOpen(true)}>
          <Text style={styles.createBtnText}>+ New User</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      />

      {/* Create Modal */}
      <Modal visible={isCreateOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New User</Text>
            {[
              { label: 'Full Name', key: 'name', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', placeholder: 'email@school.edu' },
              { label: 'Password', key: 'password', placeholder: '••••••••', secure: true },
              { label: 'Phone', key: 'phoneNumber', placeholder: '+123456789' },
            ].map(({ label, key, placeholder, secure }: any) => (
              <View key={key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{label}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={placeholder}
                  placeholderTextColor="#94a3b8"
                  value={form[key as keyof typeof form]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  secureTextEntry={secure}
                />
              </View>
            ))}

            <Text style={styles.formLabel}>ROLE</Text>
            <View style={styles.roleRow}>
              {['STUDENT', 'TEACHER', 'ADMIN'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, form.role === r && { backgroundColor: ROLE_COLORS[r] }]}
                  onPress={() => setForm(f => ({ ...f, role: r }))}
                >
                  <Text style={[styles.roleOptionText, form.role === r && { color: '#fff' }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 10 },
  searchInput: {
    backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, fontWeight: '600', color: '#1e293b',
  },
  filterRow: { marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  filterTextActive: { color: '#fff' },
  createBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  list: { padding: 16, gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  userEmail: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 2 },
  userId: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  userRight: { alignItems: 'flex-end', gap: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  deleteBtn: { padding: 4 },
  deleteText: { color: '#ef4444', fontWeight: '900', fontSize: 14 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  formInput: {
    backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontWeight: '600', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0',
  },
  roleRow: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 20 },
  roleOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  roleOptionText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
