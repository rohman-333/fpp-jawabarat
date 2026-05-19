'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export function ChatClient({ conversationId, currentUserId, otherUserId }: { conversationId: string, currentUserId: string, otherUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime changes
    const channel = supabase.channel(`conversation:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('conversation_messages')
      .select('id, sender_id, message, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (data) setMessages(data);
    setLoading(false);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    const messageText = input.trim();
    setInput('');

    // Insert message
    const { data: newMessage, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        message: messageText
      })
      .select('id')
      .single();

    if (!error) {
      // Update last_message in conversation
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Trigger server action for notification? We can call an API or just rely on DB triggers if they exist, 
      // but we will do an API call to handle push notification.
      fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otherUserId,
          title: 'Pesan Baru',
          body: messageText,
          href: `/messages/${conversationId}`,
          type: 'chat_message'
        })
      }).catch(err => console.error(err));
    }

    setSending(false);
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>Mulai percakapan dengan mengetik pesan di bawah.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}>
                  <p className="text-[15px] whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex items-end gap-2 relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Tulis pesan..."
            className="flex-1 max-h-32 min-h-[44px] resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            rows={1}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-0 flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
