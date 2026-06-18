import { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import ScreenLayout from '../../components/layout/ScreenLayout';
import ChatFoodCard from '../../components/food/ChatFoodCard';
import { radius } from '../../constants/theme';
import { getLocalDateString } from '../../utils/dates';
import { extractFoodFromResponse, stripMarkdownBold } from '../../services/extractFood';

const SUGGESTIONS = [
  'What should I eat for breakfast? 🍳',
  'Am I hitting my macros? 📊',
  'Suggest a high protein snack 💪',
  "What's a good pre-workout meal? 🏋️",
  'How do I lose weight faster? 🔥',
];

const FREE_DAILY_LIMIT = 10;

export default function AIChatScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile, goals, foodEntries, chatMessages, appendChatMessage, incrementUserMessageCount, clearChat, aiMessagesToday, isPro } = useUser();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [foodsByMessage, setFoodsByMessage] = useState({});
  const listRef = useRef(null);
  const today = getLocalDateString();
  const todayCal = (foodEntries[today] || []).reduce((s, e) => s + e.calories, 0);
  const atLimit = !isPro && aiMessagesToday >= FREE_DAILY_LIMIT;

  const extractFoods = useCallback(async (messageId, aiText) => {
    const foods = await extractFoodFromResponse(aiText);
    if (foods.length) {
      setFoodsByMessage((prev) => ({ ...prev, [messageId]: foods }));
    }
  }, []);

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg || loading || atLimit) return;
    setInput('');
    appendChatMessage({ id: Date.now(), role: 'user', text: msg, ts: Date.now() });
    incrementUserMessageCount();
    setLoading(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      // Only include the last 10 messages to keep tokens low.
      const recent = chatMessages.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const messages = [...recent, { role: 'user', content: msg }];

      const systemPrompt = `You are Foodprint AI, an expert nutrition coach and dietitian built into the Foodprint nutrition tracking app. You are friendly, encouraging, and give practical evidence-based advice.

User profile:
- Name: ${profile.name || 'there'}
- Goal: ${profile.goalType || 'eat healthy'}
- Daily calorie target: ${goals.calories} cal (today logged: ${todayCal})
- Protein goal: ${goals.protein}g
- Carb goal: ${goals.carbs}g
- Fat goal: ${goals.fat}g

Rules:
- Keep responses concise and practical (2-4 sentences max)
- Be encouraging and positive
- Give specific actionable advice
- Never diagnose medical conditions
- Never replace medical advice
- If asked about today's intake, note you can see their goals but not every logged item`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: systemPrompt,
          messages,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Error ${res.status}`);
      }
      const data = await res.json();
      const rawReply = data.content?.[0]?.text || 'Sorry, I could not respond right now.';
      const reply = stripMarkdownBold(rawReply);
      const messageId = Date.now() + 1;
      appendChatMessage({ id: messageId, role: 'assistant', text: reply, ts: Date.now() });
      // Fire-and-forget: scan the reply for loggable foods and attach cards.
      extractFoods(messageId, reply);
    } catch (err) {
      console.error('Chat error:', err);
      let errorText = 'Connection failed. Check your internet.';
      const m = err?.message || '';
      if (m.includes('API key') || m.includes('401')) errorText = 'AI not configured. Contact support.';
      else if (m.includes('429')) errorText = 'Too many messages. Wait a moment.';
      appendChatMessage({ id: Date.now() + 1, role: 'assistant', text: errorText, ts: Date.now() });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const foods = item.role === 'assistant' ? foodsByMessage[item.id] : null;
    return (
      <View>
        <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>{item.text}</Text>
        </View>
        {foods?.length ? (
          <View style={styles.foodCards}>
            {foods.map((f) => <ChatFoodCard key={f.id} food={f} />)}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenLayout edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>💬 Foodprint AI</Text>
          <TouchableOpacity onPress={clearChat}><Text style={styles.clear}>Clear</Text></TouchableOpacity>
        </View>
        {!isPro && <Text style={styles.limit}>{aiMessagesToday}/{FREE_DAILY_LIMIT} messages today</Text>}

        <FlatList
          ref={listRef}
          data={chatMessages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>Ask me anything about nutrition!</Text>}
        />

        {loading && <ActivityIndicator color={colors.accent} style={{ marginBottom: 8 }} />}

        <ScrollChips suggestions={SUGGESTIONS} onPick={sendMessage} disabled={atLimit} styles={styles} />

        {atLimit ? (
          <View style={styles.limitHitWrap}>
            <Text style={styles.limitHit}>Daily AI limit reached ({FREE_DAILY_LIMIT}/{FREE_DAILY_LIMIT}) 💬{' '}
              <Text style={styles.upgradeLink} onPress={() => navigation.navigate('Upgrade')}>Upgrade for unlimited AI coaching →</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Foodprint AI..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={() => sendMessage(input)}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(input)}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

function ScrollChips({ suggestions, onPick, disabled, styles }) {
  return (
    <View style={styles.chips}>
      {suggestions.map((s) => (
        <TouchableOpacity key={s} style={styles.chip} onPress={() => onPick(s)} disabled={disabled}>
          <Text style={styles.chipText}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  clear: { color: colors.textMuted, fontSize: 13 },
  limit: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  list: { paddingBottom: 12, flexGrow: 1 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: radius.md, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  userText: { color: colors.onAccent },
  foodCards: { marginBottom: 4 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: colors.surface2, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.textSecondary, fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  input: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, borderWidth: 1, borderColor: colors.border },
  sendBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: colors.onAccent, fontWeight: '700' },
  limitHitWrap: { paddingBottom: 16, paddingHorizontal: 8 },
  limitHit: { color: colors.textMuted, textAlign: 'center', fontSize: 13 },
  upgradeLink: { color: colors.accent, fontWeight: '700' },
});
