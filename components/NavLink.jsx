'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, end = false, className, children, ...props }) {
  const pathname = usePathname();
  const isActive = end ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  const resolved = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link href={href} className={resolved} {...props}>
      {children}
    </Link>
  );
}
