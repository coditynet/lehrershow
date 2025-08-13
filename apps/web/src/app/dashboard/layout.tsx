"use client"
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Dashboard ({children}: {children: React.ReactNode}) {
    return (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="px-4 md:px-6 lg:px-8 @container h-screen flex flex-col overflow-hidden">
              <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
                <header className="flex flex-wrap gap-3 min-h-20 py-4 shrink-0 items-center transition-all ease-linear border-b">
                  {/* Left side */}
                  <div className="flex flex-1 items-center gap-2">
                    <SidebarTrigger className="-ms-1" />
                    <div className="max-lg:hidden lg:contents">
                      <Separator
                        orientation="vertical"
                        className="me-2 data-[orientation=vertical]:h-4"
                      />
                    </div>
                  </div>
                </header>
                <div className="flex-1 overflow-y-auto ml-1 mr-1 pb-2">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
    )
}