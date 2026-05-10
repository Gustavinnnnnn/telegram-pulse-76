import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/_app")({
  component: AppRoot,
});

function AppRoot() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary glow-primary animate-pulse">
            <Send className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  return <AppLayout />;
}
