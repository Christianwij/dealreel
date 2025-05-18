'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Star } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const items: NavItem[] = [
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: <FileText className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Upload',
    href: '/dashboard/upload',
    icon: <Upload className="mr-2 h-4 w-4" />,
  },
  {
    title: 'Ratings',
    href: '/dashboard/ratings',
    icon: <Star className="mr-2 h-4 w-4" />,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start"
          >
            {item.icon}
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  );
} 