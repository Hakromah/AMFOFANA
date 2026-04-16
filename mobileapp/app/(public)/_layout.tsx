import { Tabs, router } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

function PortalButton() {
  const { token, role } = useAuth();

  const handlePress = () => {
    if (!token) {
      router.push('/(auth)/login' as any);
      return;
    }
    switch (role) {
      case 'ADMIN': router.push('/(admin)' as any); break;
      case 'TEACHER': router.push('/(teacher)' as any); break;
      default: router.push('/(student)' as any); break;
    }
  };

  return (
    <TouchableOpacity style={styles.portalBtn} onPress={handlePress}>
      <Text style={styles.portalIcon}>{token ? '⚡' : '🔑'}</Text>
      <Text style={styles.portalLabel}>{token ? 'Portal' : 'Login'}</Text>
    </TouchableOpacity>
  );
}

export default function PublicLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          // height = visible tab area (56px) + device bottom system bar inset
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
        headerRight: () => <PortalButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'AMF School', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="about"
        options={{ title: 'About Us', tabBarLabel: 'About', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>ℹ️</Text> }}
      />
      <Tabs.Screen
        name="programs"
        options={{ title: 'Programs', tabBarLabel: 'Programs', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🎓</Text> }}
      />
      <Tabs.Screen
        name="blog"
        options={{ title: 'News & Blog', tabBarLabel: 'News', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📰</Text> }}
      />
      <Tabs.Screen
        name="gallery"
        options={{ title: 'Gallery', tabBarLabel: 'Gallery', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🖼️</Text> }}
      />
      <Tabs.Screen
        name="staff"
        options={{ title: 'Our Staff', tabBarLabel: 'Staff', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text> }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{ title: 'Opportunities', tabBarLabel: 'Apply', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🌟</Text> }}
      />
      <Tabs.Screen
        name="contact"
        options={{ title: 'Contact Us', tabBarLabel: 'Contact', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📞</Text> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  portalBtn: {
    marginRight: 16,
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  portalIcon: { fontSize: 14 },
  portalLabel: { color: '#60a5fa', fontSize: 12, fontWeight: '800' },
});
