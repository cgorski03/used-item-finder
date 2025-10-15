'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home as HomeIcon,
  ListFilter as ListFilterIcon,
  Plus as PlusIcon,
  GalleryHorizontal as GalleryHorizontalIcon,
  LineChart as LineChartIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Searches', href: '/searches', icon: ListFilterIcon },
  { name: 'New Search', href: '/searches/new', icon: PlusIcon },
  { name: 'All Items', href: '/items', icon: GalleryHorizontalIcon },
  { name: 'Analytics', href: '/analytics', icon: LineChartIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink = ({ href, icon: Icon, children, isActive, onClick }: NavLinkProps) => (
  <Button
    asChild
    variant="ghost"
    className={`w-full justify-start text-sidebar-foreground text-left px-4 transition-colors 
      ${isActive
        ? 'bg-primary text-sidebar-primary-foreground hover:bg-primary/90 hover:text-sidebar-primary-foreground'
        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground'
      }`}
    onClick={onClick}
  >
    <Link href={href} prefetch={true}>
      <Icon className="h-4 w-4 mr-3" />
      <span>{children}</span>
    </Link>
  </Button>
);

export function AuthNavbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <nav className="bg-sidebar flex-1 mt-6 px-6">
      <ul className="space-y-1">
        {navLinks.map((link) => (
          <li key={link.name}>
            <NavLink
              href={link.href}
              icon={link.icon}
              isActive={pathname === link.href}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar Trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar text-white p-4 pt-12">
          <div className="text-3xl font-extrabold mb-8 text-indigo-400">{process.env.NEXT_PUBLIC_APP_NAME}</div>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-sidebar border-border ">
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <LayoutGrid className="h-5 w-5 bg-sidebar" />
            </div>
            <span className="text-lg font-semibold text-foreground">{process.env.NEXT_PUBLIC_APP_NAME}</span>
          </div>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
