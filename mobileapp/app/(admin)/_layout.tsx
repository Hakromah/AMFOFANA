import { Drawer } from 'expo-router/drawer';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const ADMIN_ROUTES = [
  { name: 'index', label: 'Dashboard', icon: '⌂' },
  { name: 'users', label: 'Users Management', icon: '👥' },
  { name: 'classes', label: 'Classes', icon: '🏫' },
  { name: 'subjects', label: 'Subjects', icon: '📚' },
  { name: 'exams', label: 'Exams', icon: '📝' },
  { name: 'materials', label: 'Materials', icon: '📁' },
  { name: 'results', label: 'Results', icon: '🏆' },
  { name: 'timetable', label: 'Timetable', icon: '🗓' },
  { name: 'reports', label: 'Reports', icon: '📊' },
];

function CustomDrawerContent({ navigation }: any) {
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.drawerContainer}>
      {/* Header — respects top notch */}
      <View style={[styles.drawerHeader, { paddingTop: Math.max(insets.top, 24) + 16 }]}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>
            {(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.drawerName} numberOfLines={1}>
          {user?.name || user?.username || 'Administrator'}
        </Text>
        <View style={styles.drawerRoleBadge}>
          <Text style={styles.drawerRoleText}>⚙ ADMIN</Text>
        </View>
      </View>

      {/* Nav Items */}
      <ScrollView style={styles.drawerNav} showsVerticalScrollIndicator={false}>
        {ADMIN_ROUTES.map((route) => (
          <TouchableOpacity
            key={route.name}
            style={styles.drawerItem}
            onPress={() => navigation.navigate(route.name)}
          >
            <Text style={styles.drawerItemIcon}>{route.icon}</Text>
            <Text style={styles.drawerItemLabel}>{route.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Logout — sits above system bottom bar */}
      <TouchableOpacity
        style={[styles.logoutBtn, { marginBottom: insets.bottom + 12 }]}
        onPress={logout}
      >
        <Text style={styles.logoutText}>🚪 Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900', fontSize: 18 },
        drawerStyle: { backgroundColor: '#0f172a', width: 280 },
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Admin Console' }} />
      <Drawer.Screen name="users" options={{ title: 'Users Management' }} />
      <Drawer.Screen name="classes" options={{ title: 'Classes' }} />
      <Drawer.Screen name="subjects" options={{ title: 'Subjects' }} />
      <Drawer.Screen name="exams" options={{ title: 'Exams' }} />
      <Drawer.Screen name="materials" options={{ title: 'Materials' }} />
      <Drawer.Screen name="results" options={{ title: 'Results' }} />
      <Drawer.Screen name="timetable" options={{ title: 'Timetable' }} />
      <Drawer.Screen name="reports" options={{ title: 'Reports' }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#0f172a' },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    alignItems: 'flex-start',
  },
  drawerAvatar: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  drawerAvatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  drawerName: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  drawerRoleBadge: {
    backgroundColor: '#1e3a5f', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
  },
  drawerRoleText: { color: '#60a5fa', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  drawerNav: { flex: 1, paddingTop: 12 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    gap: 14, borderRadius: 14,
    marginHorizontal: 8, marginVertical: 2,
  },
  drawerItemIcon: { fontSize: 18 },
  drawerItemLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    padding: 16, borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '800' },
});
