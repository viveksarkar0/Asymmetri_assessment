'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  requireAuth: () => void;
}

/**
 * Custom hook for authentication state management
 * Provides user information, loading states, and auth utilities
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  const user: AuthUser | null = session?.user ? {
    id: session.user.id || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : null;

  const isAuthenticated = !!session?.user;

  const signOut = () => {
    router.push('/api/auth/signout');
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    requireAuth,
  };
}

/**
 * Hook for protecting routes that require authentication
 * Automatically redirects to sign-in if not authenticated
 */
export function useRequireAuth(): UseAuthReturn {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/signin';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}

/**
 * Hook for checking if user has specific permissions or roles
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: string): boolean => {
    // Add role checking logic here if needed
    return true; // Default: all authenticated users have access
  };

  const canAccessChat = (): boolean => {
    return !!user;
  };

  const canCreateChat = (): boolean => {
    return !!user;
  };

  const canDeleteChat = (chatUserId: string): boolean => {
    return user?.id === chatUserId;
  };

  return {
    hasRole,
    canAccessChat,
    canCreateChat,
    canDeleteChat,
  };
}
