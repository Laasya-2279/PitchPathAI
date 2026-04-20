'use client';

import { useAuth } from "@/hooks/useAuth";
import LoginScreen from "@/components/LoginScreen";

/**
 * Client component to handle the Auth gate logic.
 * Shows LoginScreen if no user session is found.
 */
export default function LayoutContent({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0b0f1a]">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin border-[var(--accent)]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
