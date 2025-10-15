import { redirect } from 'next/navigation';
import { AuthNavbar } from '@/layout/auth-navbar';
import { AuthHeader } from '@/layout/auth-header';

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
    < div className="flex flex-1 overflow-hidden" >
      {/* Left Sidebar / Navbar */}
      < AuthNavbar />
      <div className="flex flex-col w-full min-h-screen">
        {/* Top Header */}
        <AuthHeader />


        {/* The actual page content will be rendered here */}
        <main className="flex-1 overflow-y-auto p-4 bg-background"> {/* Added padding for content */}
          {children}
        </main>
      </div>
    </div >
  );
}
