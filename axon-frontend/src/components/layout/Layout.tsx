import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="max-w-[1200px] w-full mx-auto px-6 py-8 flex-1">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100 bg-white">
        © 2026 AXon — AI Best Practice Hub. All rights reserved.
      </footer>
    </div>
  );
}
