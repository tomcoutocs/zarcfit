'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, X } from 'lucide-react';
import { adminApi, AdminUser } from '@/lib/supabase/admin-api';

const ROLE_OPTIONS: { value: 'admin' | 'trainer' | 'client'; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'client', label: 'Client' },
];

const ROLE_BADGE_VARIANT: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  trainer: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleToAdd, setRoleToAdd] = useState<Record<string, 'admin' | 'trainer' | 'client'>>({});
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantRole = async (userId: string) => {
    const role = roleToAdd[userId] || 'client';
    setUpdatingUserId(userId);
    const success = await adminApi.setUserRole(userId, role, 'grant');
    setUpdatingUserId(null);
    if (success) fetchUsers();
    else setError('Failed to update role. Please try again.');
  };

  const handleRevokeRole = async (userId: string, role: string) => {
    if (!confirm(`Remove the "${role}" role from this user?`)) return;
    setUpdatingUserId(userId);
    const success = await adminApi.setUserRole(userId, role as 'admin' | 'trainer' | 'client', 'revoke');
    setUpdatingUserId(null);
    if (success) fetchUsers();
    else setError('Failed to update role. Please try again.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>
            View all registered users and manage their platform roles (admin, trainer, client).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Add Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '—'}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No roles</span>
                          ) : (
                            u.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className={`gap-1 ${ROLE_BADGE_VARIANT[role] || ''}`}
                              >
                                {role}
                                <button
                                  onClick={() => handleRevokeRole(u.id, role)}
                                  disabled={updatingUserId === u.id}
                                  className="hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={roleToAdd[u.id] || 'client'}
                            onValueChange={(value) => setRoleToAdd(prev => ({ ...prev, [u.id]: value as 'admin' | 'trainer' | 'client' }))}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={updatingUserId === u.id}
                            onClick={() => handleGrantRole(u.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
