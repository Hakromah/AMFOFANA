import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={s.logoutBtn}>
      <Text style={s.logoutText}>Sign Out</Text>
    </TouchableOpacity>
  );
}

export default function StudentLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900', fontSize: 18 },
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌂</Text> }} />
      <Tabs.Screen name="classes" options={{ title: 'My Classes', tabBarLabel: 'Classes', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏫</Text> }} />
      <Tabs.Screen name="exams" options={{ title: 'Exams', tabBarLabel: 'Exams', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📝</Text> }} />
      <Tabs.Screen name="results" options={{ title: 'My Results', tabBarLabel: 'Results', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏆</Text> }} />
      <Tabs.Screen name="materials" options={{ title: 'Materials', tabBarLabel: 'Files', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📁</Text> }} />
      <Tabs.Screen name="timetable" options={{ title: 'Timetable', tabBarLabel: 'Schedule', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🗓</Text> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarLabel: 'Attendance', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✓</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'My Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text> }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  logoutBtn: { marginRight: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1e293b', borderRadius: 10 },
  logoutText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
});
