
import React from 'react';
import { Outlet } from 'react-router-dom';
import { MainNavigation } from '@/components/Navigation/MainNavigation';

const AdminLayout = () => {
  return (
    <div className="min-h-screen w-full">
      <MainNavigation />
      <main className="pt-16 w-full min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
