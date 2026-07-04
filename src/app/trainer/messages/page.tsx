'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile, messagingApi, Conversation, Message } from '@/lib/supabase/trainer-api';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConversationWithClient = Conversation & { client: ClientWithProfile | undefined };

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [conversations, setConversations] = useState<ConversationWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [clientList, conversationList] = await Promise.all([
      clientManagementApi.getClients(user.id),
      messagingApi.getTrainerConversations(user.id),
    ]);

    setClients(clientList);
    setConversations(
      conversationList.map(c => ({
        ...c,
        client: clientList.find(cl => cl.client_id === c.client_id),
      }))
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // If we arrived with ?client=<id> (e.g. from the client detail page's
  // "Message" button), open or create that conversation automatically.
  useEffect(() => {
    async function openPreselected() {
      if (!user?.id || !preselectClientId || loading) return;

      const existing = conversations.find(c => c.client_id === preselectClientId);
      if (existing) {
        setSelectedConversationId(existing.id);
        return;
      }

      const created = await messagingApi.getOrCreateConversation(user.id, preselectClientId);
      if (created) {
        const client = clients.find(cl => cl.client_id === preselectClientId);
        setConversations(prev => [{ ...created, client }, ...prev]);
        setSelectedConversationId(created.id);
      }
    }

    openPreselected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectClientId, loading, user?.id]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    const data = await messagingApi.getMessages(conversationId, 100);
    setMessages(data);
    setMessagesLoading(false);
    if (user?.id) {
      messagingApi.markAsRead(conversationId, user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  // Realtime subscription so new messages in the open conversation appear
  // without a manual refresh.
  useEffect(() => {
    if (!selectedConversationId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages-${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          setMessages(prev => {
            const incoming = payload.new as Message;
            if (prev.some(m => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          if (user?.id) {
            messagingApi.markAsRead(selectedConversationId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedConversationId || !newMessage.trim()) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const sent = await messagingApi.sendMessage({
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content,
    });

    if (sent) {
      setMessages(prev => (prev.some(m => m.id === sent.id) ? prev : [...prev, sent]));
      setConversations(prev =>
        prev.map(c => (c.id === selectedConversationId ? { ...c, last_message_at: sent.created_at || new Date().toISOString() } : c))
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    } else {
      setNewMessage(content);
    }
    setSending(false);
  };

  const startConversationWithClient = async (clientId: string) => {
    if (!user?.id) return;
    const existing = conversations.find(c => c.client_id === clientId);
    if (existing) {
      setSelectedConversationId(existing.id);
      return;
    }
    const created = await messagingApi.getOrCreateConversation(user.id, clientId);
    if (created) {
      const client = clients.find(cl => cl.client_id === clientId);
      setConversations(prev => [{ ...created, client }, ...prev]);
      setSelectedConversationId(created.id);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const clientsWithoutConversation = clients.filter(
    cl => !conversations.some(c => c.client_id === cl.client_id)
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Messages" description="Chat with your clients" />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[600px]">
          {/* Conversation list */}
          <div className="border-r overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
              </div>
            ) : (
              <>
                {conversations.map((conv) => {
                  const name = conv.client?.client_name || 'Client';
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b p-3 text-left transition-colors hover:bg-accent/50',
                        selectedConversationId === conv.id && 'bg-accent'
                      )}
                    >
                      <Avatar>
                        <AvatarFallback>{initials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.last_message_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {clientsWithoutConversation.length > 0 && (
                  <div className="p-3">
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      Start a conversation
                    </p>
                    <div className="space-y-1">
                      {clientsWithoutConversation.map((cl) => (
                        <button
                          key={cl.client_id}
                          onClick={() => startConversationWithClient(cl.client_id)}
                          className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-accent/50"
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{initials(cl.client_name)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{cl.client_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {conversations.length === 0 && clientsWithoutConversation.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No clients yet</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Message thread */}
          <div className="flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex items-center gap-3 border-b p-4">
                  <Avatar>
                    <AvatarFallback>{initials(selectedConversation.client?.client_name || 'Client')}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{selectedConversation.client?.client_name || 'Client'}</p>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No messages yet. Say hello!
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                              isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}
                          >
                            <p>{msg.content}</p>
                            <p
                              className={cn(
                                'mt-1 text-[10px] opacity-70',
                                isMine ? 'text-primary-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TrainerMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
