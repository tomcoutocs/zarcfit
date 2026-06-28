"use client";

import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import {
  createSupabaseBrowserClient,
  getSupabaseConfigError,
  toAuthNetworkError,
} from '@/lib/supabase/browser';

type UserMetadata = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  [key: string]: string | undefined;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (metadata: UserMetadata) => Promise<{ data: User | null; error: AuthError | null }>;
  signInWithProvider: (provider: 'github' | 'google' | 'apple') => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const configError = getSupabaseConfigError();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signUp = async (email: string, password: string, metadata?: UserMetadata) => {
    if (configError) {
      return { error: { message: configError, name: 'ConfigError', status: 500 } as AuthError };
    }

    try {
      console.log('Attempting to sign up user:', email);
      console.log('With metadata:', metadata);
      
      // Format metadata properly for Supabase
      const formattedMetadata = {
        first_name: metadata?.firstName || '',
        last_name: metadata?.lastName || '',
        ...metadata
      };
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: formattedMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      console.log('Sign up response:', { data, error });
      
      if (data?.user) {
        console.log('User created successfully, awaiting email verification');
        
        // As a fallback, try to manually create the profile if the trigger failed
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{
              id: data.user.id,
              first_name: metadata?.firstName || '',
              last_name: metadata?.lastName || '',
              bio: 'New ZarcFit user',
              height_cm: 170
            }])
            .select()
            .single();
            
          if (profileError) {
            console.warn('Manual profile creation fallback attempt failed:', profileError);
          } else {
            console.log('Manual profile creation fallback successful');
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        router.push('/dashboard');
      }

      return { error };
    } catch (err) {
      return { error: toAuthNetworkError(err) as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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

  const signInWithProvider = async (provider: 'github' | 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
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
      isLoading,
      signUp,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
      updateProfile,
      signInWithProvider,
      verifyOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 