"use client";

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu as DropdownMenuPrimitive,
  DropdownMenuContent as DropdownMenuContentPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuLabel as DropdownMenuLabelPrimitive,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuTrigger as DropdownMenuTriggerPrimitive,
} from '@/components/ui/dropdown-menu';
import {
  Sheet as SheetPrimitive,
  SheetContent as SheetContentPrimitive,
  SheetHeader as SheetHeaderPrimitive,
  SheetTitle as SheetTitlePrimitive,
  SheetTrigger as SheetTriggerPrimitive,
} from '@/components/ui/sheet';
import { Button } from './button';
import { cn } from '@/lib/utils';

type ResponsiveMenuContextProps = {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const ResponsiveMenuContext = React.createContext<ResponsiveMenuContextProps | undefined>(undefined);

const useResponsiveMenuContext = () => {
  const context = React.useContext(ResponsiveMenuContext);
  if (!context) {
    throw new Error('useResponsiveMenuContext must be used within a ResponsiveDropdownMenu');
  }
  return context;
};

const ResponsiveDropdownMenu = ({ children, open, onOpenChange, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive>) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const contextValue: ResponsiveMenuContextProps = {
    isMobile,
    open: open ?? internalOpen,
    onOpenChange: onOpenChange ?? setInternalOpen,
  };

  const MenuComponent = isMobile ? SheetPrimitive : DropdownMenuPrimitive;
  
  return (
    <ResponsiveMenuContext.Provider value={contextValue}>
      <MenuComponent open={contextValue.open} onOpenChange={contextValue.onOpenChange} {...props}>
        {children}
      </MenuComponent>
    </ResponsiveMenuContext.Provider>
  );
};

const ResponsiveDropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuTriggerPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuTriggerPrimitive>
>(({ children, ...props }, ref) => {
  const { isMobile } = useResponsiveMenuContext();
  
  const TriggerComponent = isMobile ? SheetTriggerPrimitive : DropdownMenuTriggerPrimitive;
  
  return <TriggerComponent {...props} ref={ref as any}>{children}</TriggerComponent>;
});
ResponsiveDropdownMenuTrigger.displayName = "ResponsiveDropdownMenuTrigger";

const ResponsiveDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuContentPrimitive>
>(({ children, ...props }, ref) => {
  const { isMobile } = useResponsiveMenuContext();

  if (isMobile) {
    const labelChild = React.Children.toArray(children).find(
      (child) => React.isValidElement(child) && child.type === ResponsiveDropdownMenuLabel
    );

    return (
      <SheetContentPrimitive side="bottom" {...props} ref={ref as any} className="h-auto max-h-[90vh] overflow-y-auto">
        <SheetHeaderPrimitive className="text-left">
          <SheetTitlePrimitive>
            {labelChild ? (labelChild as React.ReactElement).props.children : 'Acciones'}
          </SheetTitlePrimitive>
        </SheetHeaderPrimitive>
        <div className="flex flex-col gap-1 py-4">
          {children}
        </div>
      </SheetContentPrimitive>
    );
  }

  return <DropdownMenuContentPrimitive {...props} ref={ref}>{children}</DropdownMenuContentPrimitive>;
});
ResponsiveDropdownMenuContent.displayName = 'ResponsiveDropdownMenuContent';


const ResponsiveDropdownMenuHeader = ({ ...props }) => {
    const { isMobile } = useResponsiveMenuContext();
    if(isMobile) {
        return <SheetHeaderPrimitive {...props} />
    }
    return <div {...props} />
}
ResponsiveDropdownMenuHeader.displayName = "ResponsiveDropdownMenuHeader"


const ResponsiveDropdownMenuTitle = ({ ...props }) => {
    const { isMobile } = useResponsiveMenuContext();
    if(isMobile) {
        return <SheetTitlePrimitive {...props} />
    }
    return <div {...props} />
}
ResponsiveDropdownMenuTitle.displayName = "ResponsiveDropdownMenuTitle"

const ResponsiveDropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuLabelPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuLabelPrimitive>
>(({ className, ...props }, ref) => {
  const { isMobile } = useResponsiveMenuContext();

  // On mobile, this component's content is extracted and used in the SheetTitle,
  // so we don't render anything here to avoid duplication.
  if (isMobile) {
    return null;
  }

  return <DropdownMenuLabelPrimitive ref={ref} className={className} {...props} />;
});
ResponsiveDropdownMenuLabel.displayName = "ResponsiveDropdownMenuLabel";

const ResponsiveDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItemPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuItemPrimitive>
>(({ className, onSelect, onClick, onToggle, onBeforeToggle, ...props }, ref) => {
  const { isMobile, onOpenChange } = useResponsiveMenuContext();

  const handleSelect = (event: Event) => {
    onSelect?.(event);
    if (isMobile && !event.defaultPrevented) {
        onOpenChange(false);
    }
  }

  if (isMobile) {
    return (
      <Button
        ref={ref as any}
        variant="ghost"
        className={cn("w-full justify-start gap-2 px-4 py-3 h-auto text-base", className)}
        onClick={(e) => {
            if (onClick) {
                onClick(e as any);
            }
            if (!e.defaultPrevented) {
                onOpenChange(false);
            }
        }}
      >
        {props.children}
      </Button>
    );
  }

  return <DropdownMenuItemPrimitive ref={ref} className={className} onSelect={handleSelect} onClick={onClick} onToggle={onToggle} onBeforeToggle={onBeforeToggle} {...props} />;
});
ResponsiveDropdownMenuItem.displayName = "ResponsiveDropdownMenuItem";


const ResponsiveDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuSeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuSeparatorPrimitive>
>(({ className, ...props }, ref) => {
  const { isMobile } = useResponsiveMenuContext();

  if (isMobile) {
    return <div ref={ref as any} className={cn("h-px w-full bg-border my-2", className)} {...props} />;
  }

  return <DropdownMenuSeparatorPrimitive ref={ref} className={className} {...props} />;
});
ResponsiveDropdownMenuSeparator.displayName = "ResponsiveDropdownMenuSeparator";


export {
  ResponsiveDropdownMenu,
  ResponsiveDropdownMenuTrigger,
  ResponsiveDropdownMenuContent,
  ResponsiveDropdownMenuHeader,
  ResponsiveDropdownMenuTitle,
  ResponsiveDropdownMenuLabel,
  ResponsiveDropdownMenuItem,
  ResponsiveDropdownMenuSeparator,
};
