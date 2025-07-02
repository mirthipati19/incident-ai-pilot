
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Ticket, 
  User, 
  ShoppingCart,
  BookOpen,
  Monitor,
  BarChart3,
  LogOut,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/itsm", label: "Self Service Portal", icon: Ticket },
  { path: "/service-catalog", label: "Service Catalog", icon: ShoppingCart },
  { path: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { path: "/asset-management", label: "Asset Management", icon: Monitor },
];

export const MainNavigation: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span>Self Service Portal</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative z-10 ${
                      isActive
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2 relative z-10"
              style={{ pointerEvents: 'auto' }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
