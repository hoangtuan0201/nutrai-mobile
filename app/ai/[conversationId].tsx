import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../../src/constants/theme';

export default function AIConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Conversation: {conversationId} — to be implemented</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceBase, alignItems: 'center', justifyContent: 'center' },
  text: { ...theme.typography.body, color: theme.colors.textPrimary, textAlign: 'center' },
});
