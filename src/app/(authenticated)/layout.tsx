import { redirect } from 'next/navigation';
import { AuthNavbar } from '@/layout/auth-navbar';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = '06032003';
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar / Navbar */}
      <AuthNavbar />
      {/* The actual page content will be rendered here */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
