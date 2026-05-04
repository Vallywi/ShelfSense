import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Text style={styles.settingSub}>Alert me 3 days & 1 day before expiry</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: '#767577', true: '#2ECC71' }}
          thumbColor="#f4f3f4"
        />
      </View>

      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Dark Theme</Text>
          <Text style={styles.settingSub}>Use dark mode for the app</Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#767577', true: '#2ECC71' }}
          thumbColor="#f4f3f4"
        />
      </View>

      <Text style={styles.version}>ShelfSense MVP v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 30 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 15 },
  settingLabel: { color: '#fff', fontSize: 18 },
  settingSub: { color: '#888', fontSize: 12, marginTop: 5 },
  version: { color: '#555', textAlign: 'center', marginTop: 50 }
});
