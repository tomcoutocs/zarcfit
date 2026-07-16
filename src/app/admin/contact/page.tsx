'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { contactApi, type ContactMessage } from '@/lib/supabase/contact-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactApi.getAll().then((data) => {
      setMessages(data);
      setLoading(false);
    });
  }, []);

  const handleMarkRead = async (id: string) => {
    await contactApi.updateStatus(id, 'read');
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m)));
  };

  const handleArchive = async (id: string) => {
    await contactApi.updateStatus(id, 'archived');
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'archived' } : m)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <p className="text-muted-foreground">Support submissions from the public contact form</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading messages...</p>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No contact messages yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">
                    {msg.first_name} {msg.last_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{msg.email}</p>
                </div>
                <Badge variant={msg.status === 'new' ? 'default' : 'secondary'}>{msg.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{msg.subject}</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{msg.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  {msg.status === 'new' && (
                    <Button size="sm" onClick={() => handleMarkRead(msg.id)}>
                      Mark Read
                    </Button>
                  )}
                  {msg.status !== 'archived' && (
                    <Button size="sm" variant="outline" onClick={() => handleArchive(msg.id)}>
                      Archive
                    </Button>
                  )}
                  <Link href={`/admin/contact/${msg.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
