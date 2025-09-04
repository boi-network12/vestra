"use client";
import { NavItem } from "@/types/navItem";
import Link from "next/link";

interface MobileNavProps {
  navItems: NavItem[];
}

export default function MobileNav({ navItems }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 w-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-md p-2 flex justify-around z-10">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}