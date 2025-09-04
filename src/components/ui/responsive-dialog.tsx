"use client";

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';

const ResponsiveDialog = ({ ...props }) => {
  const isMobile = useIsMobile();
  console.log('ResponsiveDialog - isMobile:', isMobile, 'props:', props);
  
  if (isMobile) {
    console.log('Rendering Sheet for mobile');
    return <Sheet {...props} />;
  }

  console.log('Rendering Dialog for desktop');
  return <Dialog {...props} />;
};

const ResponsiveDialogTrigger = ({ ...props }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <SheetTrigger {...props} />;
  }
  
  return <DialogTrigger {...props} />;
};

const ResponsiveDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ ...props }, ref) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
        <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto" {...props} ref={ref as any} />
    );
  }

  return <DialogContent {...props} ref={ref} />;
});
ResponsiveDialogContent.displayName = 'ResponsiveDialogContent';


const ResponsiveDialogHeader = ({ ...props }) => {
    const isMobile = useIsMobile();
    if(isMobile) {
        return <SheetHeader {...props} />
    }
    return <DialogHeader {...props} />
}
ResponsiveDialogHeader.displayName = "ResponsiveDialogHeader"


const ResponsiveDialogTitle = ({ ...props }) => {
    const isMobile = useIsMobile();
    if(isMobile) {
        return <SheetTitle {...props} />
    }
    return <DialogTitle {...props} />
}
ResponsiveDialogTitle.displayName = "ResponsiveDialogTitle"

const ResponsiveDialogDescription = ({ ...props }) => {
    const isMobile = useIsMobile();
    if(isMobile) {
        return <SheetDescription {...props} />
    }
    return <DialogDescription {...props} />
}
ResponsiveDialogDescription.displayName = "ResponsiveDialogDescription"


const ResponsiveDialogFooter = ({ ...props }) => {
    const isMobile = useIsMobile();
    if(isMobile) {
        return <SheetFooter {...props} />
    }
    return <DialogFooter {...props} />
}
ResponsiveDialogFooter.displayName = "ResponsiveDialogFooter"

const ResponsiveDialogClose = ({ ...props }) => {
    const isMobile = useIsMobile();
    if(isMobile) {
        return <SheetClose {...props} />
    }
    return null; // Dialog has its own close button behavior in the corner
}
ResponsiveDialogClose.displayName = "ResponsiveDialogClose"


export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
};
