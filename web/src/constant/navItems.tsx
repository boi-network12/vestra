import { NavItem } from "@/types/navItem";
import { BiBot } from "react-icons/bi";
import { FaRobot } from "react-icons/fa";
import {
  IoHomeOutline,
  IoHome,
  IoPersonOutline,
  IoPerson,
  IoChatbubbleOutline,
  IoChatbubble,
  IoSearchOutline,
  IoSearch,
  IoSettingsOutline,
  IoSettings,
} from "react-icons/io5";

// Navigation items for MobileNav
export const mobileNavItems: NavItem[] = [
  { name: "Home", href: "/home", icon: IoHomeOutline, activeIcon: IoHome },
  { name: "Profile", href: "/profile", icon: IoPersonOutline, activeIcon: IoPerson },
  { name: "Messages", href: "/messages", icon: IoChatbubbleOutline, activeIcon: IoChatbubble },
  { name: "Explore", href: "/explore", icon: IoSearchOutline, activeIcon: IoSearch },
  { name: "Bot", href: "/bot", icon: BiBot, activeIcon: FaRobot }, // Extra item for mobile nav
];

// Navigation items for LeftSidebar
export const sidebarNavItems: NavItem[] = [
  { name: "Home", href: "/home", icon: IoHomeOutline, activeIcon: IoHome },
  { name: "Profile", href: "/profile", icon: IoPersonOutline, activeIcon: IoPerson },
  { name: "Messages", href: "/messages", icon: IoChatbubbleOutline, activeIcon: IoChatbubble },
  { name: "Explore", href: "/explore", icon: IoSearchOutline, activeIcon: IoSearch },
  { name: "Settings", href: "/settings", icon: IoSettingsOutline, activeIcon: IoSettings }, 
  { name: "Bot", href: "/bot", icon: BiBot, activeIcon: FaRobot },
];