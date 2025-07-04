
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
  ChevronDown
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
    <nav className="bg-white shadow-lg border-b border-gray-100 relative z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 text-xl font-bold text-gray-900 hover:text-blue-600 transition-all duration-200 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Authexa Service Portal
                </span>
                <span className="text-xs text-gray-500 font-medium">Enterprise IT Management</span>
              </div>
            </Link>
            
            {/* Navigation Items */}
            <div className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 -z-10" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
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
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">John Doe</p>
                  <p className="text-xs text-gray-500">john.doe@company.com</p>
                </div>
                <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
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
