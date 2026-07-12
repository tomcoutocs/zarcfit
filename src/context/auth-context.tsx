"use client";

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import {
  createSupabaseBrowserClient,
  getSupabaseConfigError,
  toAuthNetworkError,
} from '@/lib/supabase/browser';
import { homeForRole } from '@/lib/auth-routes';

type UserMetadata = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  /** Set to 'true' when signing up via a trainer invitation link */
  invitationSignup?: string;
  [key: string]: string | undefined;
};

type UserRole = 'admin' | 'trainer' | 'client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isTrainer: boolean;
  isClient: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: UserMetadata,
    role?: UserRole
  ) => Promise<{
    error: AuthError | null;
    resentConfirmation?: boolean;
    alreadyConfirmed?: boolean;
  }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (metadata: UserMetadata) => Promise<{ data: User | null; error: AuthError | null }>;
  signInWithProvider: (
    provider: 'github' | 'google' | 'apple',
    options?: { signupRole?: 'trainer' }
  ) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configError = getSupabaseConfigError();

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return (data?.role as UserRole | undefined) ?? null;
  }, [supabase]);

  const refreshRole = async () => {
    if (user) {
      const userRole = await fetchUserRole(user.id);
      setRole(userRole);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          const userRole = await fetchUserRole(data.session.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        } else {
          setRole(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserRole]);

  const emailRedirectTo = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/login?emailConfirmed=1`;

  const resendSignupConfirmation = async (email: string) => {
    if (configError) {
      return { error: { message: configError, name: 'ConfigError', status: 500 } as AuthError };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo },
    });

    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: UserMetadata, role: UserRole = 'trainer') => {
    if (configError) {
      return { error: { message: configError, name: 'ConfigError', status: 500 } as AuthError };
    }

    if (role === 'client' && metadata?.invitationSignup !== 'true') {
      return {
        error: {
          message: 'Client accounts can only be created through a trainer invitation.',
          name: 'InviteOnly',
          status: 403,
        } as AuthError,
      };
    }

    try {
      const formattedMetadata = {
        first_name: metadata?.firstName || '',
        last_name: metadata?.lastName || '',
        signup_role: role,
        invitation_signup: metadata?.invitationSignup === 'true' ? 'true' : undefined,
        ...metadata,
      };
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: formattedMetadata,
          emailRedirectTo,
        }
      });

      if (error) {
        return { error };
      }

      const isRepeatedSignup =
        !!data.user && (!data.user.identities || data.user.identities.length === 0);

      if (isRepeatedSignup) {
        const isConfirmed = !!(data.user?.email_confirmed_at || data.user?.confirmed_at);

        if (isConfirmed) {
          return {
            error: {
              message: 'An account with this email already exists. Please sign in instead.',
              name: 'AlreadyRegistered',
              status: 400,
            } as AuthError,
            alreadyConfirmed: true,
          };
        }

        const { error: resendError } = await resendSignupConfirmation(email);
        if (resendError) {
          return { error: resendError };
        }

        return { error: null, resentConfirmation: true };
      }
      
      if (data?.user) {
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              user_id: data.user.id,
              role: role
            }]);
            
          if (roleError) {
            console.warn('Role assignment failed:', roleError);
          }
        } catch (roleErr) {
          console.warn('Error assigning role:', roleErr);
        }
        
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: data.user.id,
              first_name: metadata?.firstName || '',
              last_name: metadata?.lastName || '',
              bio: role === 'trainer' ? 'ZarcFit trainer' : 'ZarcFit client',
              height_cm: 170
            }])
            .select()
            .single();
            
          if (profileError) {
            console.warn('Manual profile creation fallback attempt failed:', profileError);
          }
        } catch (profileErr) {
          console.warn('Error in manual profile creation fallback:', profileErr);
        }
      }
      
      return { error };
    } catch (err) {
      console.error('Unexpected error in signUp function:', err);
      const networkError = toAuthNetworkError(err);
      return {
        error: networkError as AuthError,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (configError) {
      return { error: { message: configError, name: 'ConfigError', status: 500 } as AuthError };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const userRole = await fetchUserRole(data.user.id);
        setRole(userRole);
        router.push(homeForRole(userRole));
      }

      return { error };
    } catch (err) {
      return { error: toAuthNetworkError(err) as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    router.push('/');
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const resetPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password
    });
    
    if (!error) {
      router.push('/auth/login');
    }
    
    return { error };
  };

  const updateProfile = async (metadata: UserMetadata) => {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    });
    
    return { 
      data: data.user,
      error 
    };
  };

  const signInWithProvider = async (
    provider: 'github' | 'google' | 'apple',
    options?: { signupRole?: 'trainer' }
  ) => {
    const redirectTo = options?.signupRole
      ? `${window.location.origin}/auth/callback?signup=trainer`
      : `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      isTrainer: role === 'trainer',
      isClient: role === 'client',
      isAdmin: role === 'admin',
      isLoading,
      signUp,
      resendSignupConfirmation,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
      updateProfile,
      signInWithProvider,
      verifyOtp,
      refreshRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 