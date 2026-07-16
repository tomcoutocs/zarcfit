'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { clientManagementApi, ClientWithProfile, messagingApi, Conversation, Message } from '@/lib/supabase/trainer-api';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { uploadMessageAttachment } from '@/lib/supabase/storage';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DashboardPageHeader from '@/components/layout/DashboardPageHeader';
import { Send, MessageSquare, Search, Paperclip, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ConversationWithClient = Conversation & { client: ClientWithProfile | undefined };

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

type ClientThread = {
  client: ClientWithProfile;
  conversation?: Conversation;
};

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectClientId = searchParams.get('client');

  const [clients, setClients] = useState<ClientWithProfile[]>([]);
  const [conversations, setConversations] = useState<ConversationWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clientThreads: ClientThread[] = clients
    .map((client) => ({
      client,
      conversation: conversations.find((c) => c.client_id === client.client_id),
    }))
    .sort((a, b) => {
      const aTime = a.conversation?.last_message_at;
      const bTime = b.conversation?.last_message_at;
      if (aTime && bTime) {
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      }
      if (aTime) return -1;
      if (bTime) return 1;
      return a.client.client_name.localeCompare(b.client.client_name);
    });

  const openClientThread = useCallback(async (clientId: string) => {
    if (!user?.id) return;

    setSelectedClientId(clientId);

    const existing = conversations.find((c) => c.client_id === clientId);
    if (existing) {
      setSelectedConversationId(existing.id);
      return;
    }

    const created = await messagingApi.getOrCreateConversation(user.id, clientId);
    if (created) {
      const client = clients.find((cl) => cl.client_id === clientId);
      setConversations((prev) => [{ ...created, client }, ...prev]);
      setSelectedConversationId(created.id);
    }
  }, [clients, conversations, user?.id]);

  // If we arrived with ?client=<id>, open that client automatically.
  useEffect(() => {
    if (!user?.id || !preselectClientId || loading) return;
    openClientThread(preselectClientId);
  }, [preselectClientId, loading, openClientThread, user?.id]);

  const loadMessages = useCallback(async (conversationId: string, query?: string) => {
    setMessagesLoading(true);
    const data = query?.trim()
      ? await messagingApi.searchMessages(conversationId, query.trim())
      : await messagingApi.getMessages(conversationId, 100);
    setMessages(data);
    setMessagesLoading(false);
    if (user?.id && !query?.trim()) {
      messagingApi.markAsRead(conversationId, user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId, searchQuery);
    }
  }, [selectedConversationId, searchQuery, loadMessages]);

  // Typing indicator via broadcast
  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`typing-${selectedConversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as { userId?: string; typing?: boolean };
        if (data.userId && data.userId !== user.id) {
          setOtherTyping(Boolean(data.typing));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setOtherTyping(false);
    };
  }, [selectedConversationId, user?.id]);

  const broadcastTyping = (typing: boolean) => {
    if (!selectedConversationId || !user?.id) return;
    const supabase = createSupabaseBrowserClient();
    supabase.channel(`typing-${selectedConversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, typing },
    });
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 1500);
  };

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
    broadcastTyping(false);
    const content = newMessage.trim();
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content,
      is_read: false,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const sent = await messagingApi.sendMessage({
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content,
      message_type: 'text',
    });

    if (sent) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? sent : m)).filter((m, i, arr) =>
          m.id !== sent.id || arr.findIndex((x) => x.id === sent.id) === i
        )
      );
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedConversationId
              ? { ...c, last_message_at: sent.created_at || new Date().toISOString() }
              : c
          )
          .sort(
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          )
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(content);
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !selectedConversationId) return;

    setUploadingAttachment(true);
    const { url, error: uploadError } = await uploadMessageAttachment(user.id, file);
    if (!url) {
      toast.error(uploadError || 'Upload failed');
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: 'Photo',
      attachment_url: url,
      message_type: 'image',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const sent = await messagingApi.sendMessage({
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: 'Photo',
      attachment_url: url,
      message_type: 'image',
    });

    if (sent) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error('Failed to send attachment');
    }

    setUploadingAttachment(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectedThread = clientThreads.find((thread) => thread.client.client_id === selectedClientId)
    || clientThreads.find((thread) => thread.conversation?.id === selectedConversationId);

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
            ) : clientThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No clients yet</p>
              </div>
            ) : (
              clientThreads.map(({ client, conversation }) => {
                const name = client.client_name || 'Client';
                const isSelected = selectedClientId === client.client_id;
                return (
                  <button
                    key={client.client_id}
                    onClick={() => openClientThread(client.client_id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b p-3 text-left transition-colors hover:bg-accent/50',
                      isSelected && 'bg-accent'
                    )}
                  >
                    <Avatar>
                      <AvatarFallback>{initials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {conversation
                          ? new Date(conversation.last_message_at).toLocaleDateString()
                          : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Message thread */}
          <div className="flex flex-col">
            {selectedThread ? (
              <>
                <div className="flex items-center gap-3 border-b p-4">
                  <Avatar>
                    <AvatarFallback>{initials(selectedThread.client.client_name || 'Client')}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{selectedThread.client.client_name || 'Client'}</p>
                </div>

                <div className="border-b px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search messages..."
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {!selectedConversationId ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Opening conversation...
                    </p>
                  ) : messagesLoading ? (
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
                            {msg.message_type === 'image' && msg.attachment_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="max-w-full rounded-lg mb-1"
                              />
                            ) : (
                              <p>{msg.content}</p>
                            )}
                            <div
                              className={cn(
                                'mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70',
                                isMine ? 'text-primary-foreground' : 'text-muted-foreground'
                              )}
                            >
                              <span>
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                              {isMine &&
                                (msg.is_read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {otherTyping && (
                    <p className="text-xs text-muted-foreground italic">Client is typing...</p>
                  )}
                </div>

                <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAttachment}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    disabled={uploadingAttachment || !selectedConversationId}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending || !selectedConversationId}
                  />
                  <Button type="submit" size="icon" disabled={sending || !newMessage.trim() || !selectedConversationId}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Select a client to start chatting</p>
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
