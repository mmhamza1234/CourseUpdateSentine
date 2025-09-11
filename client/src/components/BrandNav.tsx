import React from "react";
import { ShieldCheck, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRtl } from "@/hooks/use-rtl";
import { useAuth } from "@/hooks/use-auth";

export default function BrandNav() {
  const { isRtl, toggleRtl } = useRtl();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Course Update Sentinel</h1>
              <p className="text-sm text-muted-foreground">الذكاء للأعمال</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleRtl}
            className="px-3 py-1 text-sm"
            data-testid="button-toggle-rtl"
          >
            <Globe className="w-4 h-4 mr-1" />
            {isRtl ? "English" : "عربي"}
          </Button>
          
          {user && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-secondary rounded-md">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-username">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="ml-2 text-xs"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
