import { Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function TeacherLayout() {
  const { logout } = useAuth();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900', fontSize: 18 },
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌂</Text> }} />
      <Tabs.Screen name="classes" options={{ title: 'My Classes', tabBarLabel: 'Classes', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏫</Text> }} />
      <Tabs.Screen name="exams" options={{ title: 'Exams', tabBarLabel: 'Exams', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📝</Text> }} />
      <Tabs.Screen name="results" options={{ title: 'Results', tabBarLabel: 'Results', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏆</Text> }} />
      <Tabs.Screen name="materials" options={{ title: 'Materials', tabBarLabel: 'Files', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📁</Text> }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarLabel: 'Students', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👩‍🎓</Text> }} />
      <Tabs.Screen name="timetable" options={{ title: 'Timetable', tabBarLabel: 'Schedule', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🗓</Text> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarLabel: 'Attendance', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✓</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'My Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text> }} />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  logoutBtn: { marginRight: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1e293b', borderRadius: 10 },
  logoutText: { color: '#ef4444', fontSize: 12, fontWeight: '800' },
});
