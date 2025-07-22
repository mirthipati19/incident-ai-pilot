
import React from 'react';
import { MainNavigation } from '@/components/Navigation/MainNavigation';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <div className="min-h-screen w-full">
      <MainNavigation />
      <main className="pt-16 w-full min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;
