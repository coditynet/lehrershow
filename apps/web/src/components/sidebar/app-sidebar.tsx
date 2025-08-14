"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Bell,
  Boxes,
  Building2,
  Calendar,
  ChartLine,
  Coins,
  Gauge,
  Landmark,
  UsersRound,
} from "lucide-react";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import clsx from "clsx";
import { NavUser } from "./user-nav";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  disabled?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const data: {
  navMain: NavGroup[];
  settingsNav: NavGroup[];
} = {
  navMain: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Gauge,
        },
        {
          title: "Songs",
          url: "/dashboard/songs",
          icon: UsersRound,
        },
        {
          title: "Anfragen",
          url: "/dashboard/requests",
          icon: Calendar,
          disabled: true,
        },
      ],
    },
  ],
  settingsNav: [
    {
      title: "Einstellungen",
      items: [
        {
          title: "Nutzer",
          url: "/dashboard/settings/users",
          icon: UsersRound,
          disabled: true
        },
        {
          title: "Registrierung",
          url: "/dashboard/settings/registration",
          icon: Boxes,
          disabled: true
        },
      ],
    },
  ],
};

function SidebarLogo() {
  const sidebar = useSidebar();

  return (
    <div className="flex gap-2 px-2 group-data-[collapsible=icon]:px-0 transition-[padding] duration-200 ease-in-out">
      <Link className="group/logo inline-flex" href="/dashboard">
        <span className="sr-only">Logo</span>
        {sidebar.open ? (
          <img
            src="/logo-full.png"
            alt="Logo"
            className="h-12 w-auto max-w-[150px] group-data-[collapsible=icon]:h-10 transition-[height,max-width] duration-200 ease-in-out filter dark:invert dark:brightness-200"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-8 group-data-[collapsible=icon]:h-10 transition-[height,max-width] duration-200 ease-in-out filter dark:invert dark:brightness-200"
            style={{ objectFit: "contain" }}
          />
        )}
      </Link>
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? "/";

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader className="h-18 max-md:mt-2 mb-2 justify-center">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="-mt-2">
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="uppercase text-muted-foreground/65">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/dashboard" && pathname.startsWith(item.url));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        disabled={item.disabled}
                        className={clsx(
                          "font-medium gap-3 h-9 transition-colors hover:bg-muted/50",
                          isActive && "bg-primary/10 text-primary",
                          item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <Link href={item.url} className="inline-flex items-center gap-2">
                          {item.icon && (
                            <item.icon
                              className={clsx(
                                "size-5 text-muted-foreground transition-colors",
                                isActive && "text-primary"
                              )}
                              aria-hidden="true"
                            />
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {data.settingsNav.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="uppercase text-muted-foreground/65">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    (item.url !== "/dashboard" && pathname.startsWith(item.url));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        disabled={item.disabled}
                        className={clsx(
                          "font-medium gap-3 h-9 transition-colors hover:bg-muted/50",
                          isActive && "bg-primary/10 text-primary sidebar-primary",
                          item.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <Link href={item.url} className="inline-flex items-center gap-2">
                          {item.icon && (
                            <item.icon
                              className={clsx(
                                "size-5 text-muted-foreground transition-colors",
                                isActive && "text-primary"
                              )}
                              aria-hidden="true"
                            />
                          )}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="flex items-center justify-between px-2 h-16">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}