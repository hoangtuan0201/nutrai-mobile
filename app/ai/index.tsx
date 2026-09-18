import { View, Text, StyleSheet } from 'react-native';
import theme from '../../src/constants/theme';

export default function AIIndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AI Conversations — to be implemented</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceBase, alignItems: 'center', justifyContent: 'center' },
  text: { ...theme.typography.h1, color: theme.colors.textPrimary },
});
