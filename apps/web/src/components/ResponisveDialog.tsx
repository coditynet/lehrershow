"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import Loader from "./loader";
import { Loader2 } from "lucide-react";

interface ResponsiveDialogProps {
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  actionButton?: {
    text: string;
    onClick: () => void;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    isLoading?: boolean;
    disabled?: boolean;
  };
}

export function ResponsiveDialog({
  children,
  trigger,
  title,
  description,
  className,
  open,
  onOpenChange,
  icon: Icon,
  actionButton,
}: ResponsiveDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  const ActionButton = ({ className = "" }: { className?: string }) => (
    <Button
      variant={actionButton?.variant ?? "default"}
      onClick={actionButton?.onClick}
      disabled={actionButton?.isLoading || actionButton?.disabled}
      className={className}
    >
      {actionButton?.isLoading ? (
        <>
          <Loader2 className="animate-spin" />
        </>
      ) : (
        actionButton?.text
      )}
    </Button>
  );

  const IconContainer = () => {
    if (!Icon) return null;

    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full border"
          aria-hidden="true"
        >
          <Icon className="opacity-80" size={16} />
        </div>
        {(title || description) && (
          <div className="text-center">
            {title && (
              <DialogTitle className="sm:text-center">{title}</DialogTitle>
            )}
            {description && (
              <DialogDescription className="sm:text-center">
                {description}
              </DialogDescription>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isDesktop) {
    return (
      <Dialog open={open ?? isOpen} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("sm:max-w-[425px]", className)}>
          {Icon ? (
            <IconContainer />
          ) : (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          {children}
          <DialogFooter className="flex flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </DialogClose>
            {actionButton && <ActionButton className="flex-1" />}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open ?? isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        {Icon ? (
          <IconContainer />
        ) : (
          <DrawerHeader className="text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
        )}
        <div className={cn("px-4", className)}>{children}</div>
        <DrawerFooter className="flex flex-col gap-2">
          {actionButton && <ActionButton className="flex-1 w-full" />}
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1 w-full">
              Abbrechen
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}