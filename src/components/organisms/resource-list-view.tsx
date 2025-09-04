
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ResourceListViewProps<T> = {
  items: T[];
  view: 'grid' | 'list';
  isLoading: boolean;
  renderGridItem: (item: T, index: number) => React.ReactNode;
  renderListItem: (item: T, index: number) => React.ReactNode;
  noResultsMessage: string;
  gridClassName?: string;
  listClassName?: string;
};

const GridViewSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
           <Card key={i}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full mt-4" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
           </Card>
        ))}
    </div>
);

const ListViewSkeleton = () => (
    <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
           <Card key={i} className="p-2">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                 <Skeleton className="h-6 w-20" />
            </div>
           </Card>
        ))}
    </div>
);

export default function ResourceListView<T extends { id: string }>({
  items,
  view,
  isLoading,
  renderGridItem,
  renderListItem,
  noResultsMessage,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
  listClassName = "space-y-2",
}: ResourceListViewProps<T>) {

  if (isLoading) {
    return view === 'grid' ? <GridViewSkeleton /> : <ListViewSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full text-center py-12 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">{noResultsMessage}</p>
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className={cn(
         "grid gap-4 w-full overflow-x-hidden",
         gridClassName
       )}>
        {items.map((item, index) => <div key={item.id}>{renderGridItem(item, index)}</div>)}
      </div>
    );
  }

  return (
    <div className={listClassName}>
      {items.map((item, index) => <div key={item.id}>{renderListItem(item, index)}</div>)}
    </div>
  );
}
