import { ReactNode } from "react";
import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface PageProps {
  children?: ReactNode;
  sideBarHamburger?: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  toggleSidebar?: () => void;
}
