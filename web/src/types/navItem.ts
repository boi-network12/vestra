import { IconType } from "react-icons";

export interface NavItem {
  name: string;
  href: string;
  icon: IconType;
  activeIcon: IconType;
}