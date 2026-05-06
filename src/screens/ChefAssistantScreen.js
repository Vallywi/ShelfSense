import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { subscribeToItems } from '../services/firestore';
import { chatWithChef } from '../services/api';

const QUICK_PROMPTS = [
  { label: 'What can I cook now?', icon: 'flash' },
  { label: 'Use what\'s expiring', icon: 'time' },
  { label: 'Quick 15-min meal', icon: 'timer' },
  { label: 'Something healthy', icon: 'leaf' },
];

export default function ChefAssistantScreen({ navigation }) {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToItems((fetchedItems) => {
      setItems(fetchedItems);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, thinking]);

  const expiringSoon = items.filter(i => i.status === 'soon' || i.status === 'urgent' || i.status === 'expired');

  const sendMessage = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || thinking) return;

    const userMsg = { role: 'user', text: trimmed, id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setThinking(true);

    try {
      const data = await chatWithChef(trimmed, items, newMessages);
      const aiMsg = {
        role: 'assistant',
        text: data.reply || "I'm not sure what to say.",
        id: Date.now() + 1,
      };
      setMessages([...newMessages, aiMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        text: `I had trouble responding. ${err.message || 'Please try again.'}`,
        id: Date.now() + 1,
        isError: true,
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setThinking(false);
    }
  };

  const renderMarkdownLite = (text, color) => {
    // Lightweight markdown rendering: **bold** + bullet lines
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isBullet = /^\s*[-*•]\s/.test(line);
      const cleaned = line.replace(/^\s*[-*•]\s/, '');
      const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);

      return (
        <View key={idx} style={isBullet ? styles.bulletRow : null}>
          {isBullet && <Text style={[styles.bulletDot, { color }]}>•</Text>}
          <Text style={[styles.msgText, { color, flex: isBullet ? 1 : undefined }]}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={pIdx} style={{ fontWeight: '800' }}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return <Text key={pIdx}>{part}</Text>;
            })}
          </Text>
        </View>
      );
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={[styles.avatarBg, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="sparkles" size={22} color={theme.primaryDeep} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Chef Sage</Text>
          <View style={styles.headerStatus}>
            <View style={[styles.onlineDot, { backgroundColor: theme.safe }]} />
            <Text style={[styles.headerSub, { color: theme.subText }]}>
              AI Recipe Assistant · {items.length} item{items.length === 1 ? '' : 's'} in pantry
            </Text>
          </View>
        </View>
      </View>

      {/* Chat scroll */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome card (shown only if no messages) */}
        {messages.length === 0 && (
          <View style={[styles.welcomeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.welcomeIconBg, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="sparkles" size={28} color={theme.primaryDeep} />
            </View>
            <Text style={[styles.welcomeTitle, { color: theme.text }]}>
              Hi! I'm Chef Sage 🍳
            </Text>
            <Text style={[styles.welcomeText, { color: theme.subText }]}>
              I know what's in your pantry. Ask me what to cook, recipe ideas, or how to use what's expiring soon.
            </Text>

            {expiringSoon.length > 0 && (
              <View style={[styles.expiringBanner, { backgroundColor: theme.warningSoft, borderColor: theme.warning + '55' }]}>
                <Ionicons name="time" size={14} color={theme.warning} />
                <Text style={[styles.expiringText, { color: theme.warning }]}>
                  {expiringSoon.length} item{expiringSoon.length === 1 ? '' : 's'} expiring soon — let me help!
                </Text>
              </View>
            )}

            <Text style={[styles.suggestLabel, { color: theme.subText }]}>QUICK START</Text>
            <View style={styles.suggestGrid}>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.suggestChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => sendMessage(p.label)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={p.icon} size={14} color={theme.primaryDeep} />
                  <Text style={[styles.suggestChipText, { color: theme.text }]} numberOfLines={1}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.msgRow,
                { justifyContent: isUser ? 'flex-end' : 'flex-start' },
              ]}
            >
              {!isUser && (
                <View style={[styles.msgAvatar, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="sparkles" size={14} color={theme.primaryDeep} />
                </View>
              )}
              <View
                style={[
                  styles.msgBubble,
                  isUser
                    ? { backgroundColor: theme.primaryDeep, borderBottomRightRadius: 4 }
                    : {
                        backgroundColor: msg.isError ? theme.dangerSoft : theme.card,
                        borderColor: msg.isError ? theme.danger + '55' : theme.border,
                        borderWidth: 1,
                        borderBottomLeftRadius: 4,
                      },
                ]}
              >
                {renderMarkdownLite(
                  msg.text,
                  isUser ? '#FFFFFF' : (msg.isError ? theme.danger : theme.text)
                )}
              </View>
            </View>
          );
        })}

        {/* Thinking indicator */}
        {thinking && (
          <View style={[styles.msgRow, { justifyContent: 'flex-start' }]}>
            <View style={[styles.msgAvatar, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="sparkles" size={14} color={theme.primaryDeep} />
            </View>
            <View style={[styles.msgBubble, styles.thinkingBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="small" color={theme.primaryDeep} />
              <Text style={[styles.thinkingText, { color: theme.subText }]}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
        <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Chef Sage anything..."
            placeholderTextColor={theme.subText}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            multiline={false}
            editable={!thinking}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: theme.primaryDeep },
            (!input.trim() || thinking) && { opacity: 0.4 },
          ]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || thinking}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarBg: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  headerSub: { fontSize: 11, fontWeight: '500', flex: 1 },

  chatContent: { padding: 16, paddingBottom: 20 },

  welcomeCard: {
    padding: 20, borderRadius: 18, borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeIconBg: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  welcomeText: {
    fontSize: 13, textAlign: 'center', lineHeight: 19,
    fontWeight: '500', marginBottom: 16,
  },
  expiringBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, marginBottom: 16,
  },
  expiringText: { fontSize: 12, fontWeight: '700' },

  suggestLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  suggestGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, width: '100%',
  },
  suggestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    flexBasis: '48%', flexGrow: 1,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  suggestChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16,
  },
  msgText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bulletDot: { fontSize: 14, lineHeight: 20, fontWeight: '700' },

  thinkingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderBottomLeftRadius: 4,
  },
  thinkingText: { fontSize: 13, fontStyle: 'italic', fontWeight: '500' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
  },
  inputBox: {
    flex: 1, borderWidth: 1, borderRadius: 22,
    paddingHorizontal: 16, height: 44,
    justifyContent: 'center',
  },
  input: { fontSize: 14, fontWeight: '500' },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
});
