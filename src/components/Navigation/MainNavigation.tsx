
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
  Shield,
  Bell,
  Settings,
  ChevronDown,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/itsm", label: "Self Service Portal", icon: Ticket },
  { path: "/service-catalog", label: "Service Catalog", icon: ShoppingCart },
  { path: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { path: "/asset-management", label: "Asset Management", icon: Package },
  { path: "/remote-desktop", label: "Remote Desktop", icon: Monitor },
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
    <nav className="bg-gradient-primary shadow-xl border-b border-white/10 relative z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3 text-sm sm:text-xl font-bold text-white hover:text-white/90 transition-all duration-200 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:bg-white/30">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-base sm:text-lg font-bold text-white">
                  Authexa Service Portal
                </span>
                <span className="text-xs text-white/70 font-medium">Enterprise IT Management</span>
              </div>
            </Link>
            
            {/* Navigation Items */}
            <div className="hidden lg:flex items-center space-x-1 sm:space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 relative group ${
                      isActive
                        ? "bg-white/20 text-white shadow-md border border-white/30 backdrop-blur-sm"
                        : "text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20"
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                    <span className="whitespace-nowrap hidden sm:inline">{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm -z-10" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">john.doe@company.com</p>
                </div>
              <DropdownMenuItem asChild className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50">
                <Link to="/profile">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-red-50 text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
