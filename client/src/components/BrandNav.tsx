import React from "react";
import { ShieldCheck, User, Globe, BarChart3, Calendar, Target, CheckSquare, Eye, FolderOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRtl } from "@/hooks/use-rtl";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export default function BrandNav() {
  const { isRtl, toggleRtl } = useRtl();
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/events", label: "Events", icon: Calendar },
    { path: "/impacts", label: "Impacts", icon: Target },
    { path: "/tasks", label: "Tasks", icon: CheckSquare },
    { path: "/watchlist", label: "Watchlist", icon: Eye },
    { path: "/assets", label: "Assets", icon: FolderOpen },
    { path: "/reference", label: "Reference", icon: ShieldCheck },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="bg-card border-b border-border">
      {/* Top Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Abdelrazik AI For Business Course Updating Tool</h1>
                <p className="text-sm text-muted-foreground">أداة تحديث الدورة التدريبية</p>
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
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 border-b border-border">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant="ghost"
                    className={`px-4 py-3 rounded-t-lg rounded-b-none border-b-2 transition-colors ${
                      isActive
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    data-testid={`nav-${item.path === "/" ? "dashboard" : item.path.slice(1)}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
