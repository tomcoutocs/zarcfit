'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contactApi, type ContactMessage } from '@/lib/supabase/contact-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [message, setMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (!params.id) return;
    contactApi.getById(params.id).then((data) => {
      setMessage(data);
      if (data?.status === 'new') {
        contactApi.updateStatus(data.id, 'read');
      }
    });
  }, [params.id]);

  if (!message) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/contact')}>
        ← Back to inbox
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {message.first_name} {message.last_name}
            </CardTitle>
            <Badge>{message.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{message.email}</p>
          {message.phone && <p className="text-sm text-muted-foreground">{message.phone}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Subject</p>
            <p>{message.subject}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Message</p>
            <p className="whitespace-pre-wrap">{message.message}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Received {new Date(message.created_at).toLocaleString()}
          </p>
          <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}>
            <Button>Reply via Email</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
