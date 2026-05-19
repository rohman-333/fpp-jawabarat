'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Loader2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function ChatClient({ 
  conversationId, 
  currentUserId, 
  otherUserId,
  receiverType = 'buyer' // 'buyer' | 'seller' depending on who receives the message
}: { 
  conversationId: string; 
  currentUserId: string; 
  otherUserId: string;
  receiverType?: 'buyer' | 'seller';
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime changes in conversation messages
    const channel = supabase.channel(`messages_realtime:${conversationId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicate insert bugs from parallel events
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // Mark as read if the current user is not the sender
          if (newMessage.sender_id !== currentUserId) {
            markAsRead();
          }
          scrollToBottom();
        } else if (payload.eventType === 'UPDATE') {
          const updatedMessage = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
        }
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
      .select('id, sender_id, message, is_read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (data) {
      setMessages(data);
      // Mark loaded messages as read instantly
      markAsRead();
    }
    setLoading(false);
    scrollToBottom();
  };

  const markAsRead = async () => {
    try {
      await supabase
        .from('conversation_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUserId)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
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

    // Insert message into database
    const { data: inserted, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        message: messageText,
        is_read: false
      })
      .select('id, sender_id, message, is_read, created_at')
      .single();

    if (!error && inserted) {
      // Append locally to bypass network delay
      setMessages(prev => {
        if (prev.some(m => m.id === inserted.id)) return prev;
        return [...prev, inserted];
      });

      // Update conversations metadata for list displays
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Determine correct navigation URL depending on target receiver
      const relativeHref = receiverType === 'seller' 
        ? `/dashboard/messages/${conversationId}` 
        : `/messages/${conversationId}`;

      // Call global notification API
      fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otherUserId,
          title: 'Pesan Baru',
          body: messageText,
          href: relativeHref,
          type: 'chat_message'
        })
      }).catch(err => console.error('Notification dispatch error:', err));
    } else if (error) {
      console.error('Error inserting message:', error);
      alert('Gagal mengirim pesan.');
    }

    setSending(false);
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 absolute inset-0">
      {/* Scrollable Message Box */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-blue-50 text-[#0F52BA] rounded-full flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">Belum ada obrolan</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Mulai percakapan Anda dengan mengetik dan mengirim pesan di bawah.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-2xs ${
                    isMe 
                      ? 'bg-gradient-to-r from-blue-600 to-[#0F52BA] text-white rounded-br-none' 
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                  }`}>
                    <p className="text-xs md:text-sm font-medium whitespace-pre-wrap break-words leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 px-1 font-bold">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      msg.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-300" />
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
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
            placeholder="Ketik pesan..."
            className="flex-1 max-h-32 min-h-[44px] resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
            rows={1}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-0 flex items-center justify-center active:scale-95 shadow-sm transition-all"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
