"use client";
import { NavItem } from "@/types/navItem";
import Link from "next/link";

interface MobileNavProps {
  navItems: NavItem[];
}

export default function MobileNav({ navItems }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 w-full bg-white shadow-md p-2 flex justify-around z-10">
      {navItems.map((item) => {
        const Icon = item.icon; // Icon is now a React component
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center text-gray-700 hover:text-blue-500"
          >
            <Icon className="h-6 w-6" /> {/* Render icon as component */}
            <span className="text-xs">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}