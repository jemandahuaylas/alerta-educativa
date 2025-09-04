
"use client";

import { Search, List, LayoutGrid, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ResourceToolbarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  onFilterClick: () => void;
  filterBadgeCount?: number;
  showFilterButton?: boolean;
};

export default function ResourceToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Buscar por nombre de estudiante...",
  view,
  onViewChange,
  onFilterClick,
  filterBadgeCount = 0,
  showFilterButton = true,
}: ResourceToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="w-full rounded-lg bg-background pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        {showFilterButton && (
          <Button
            variant={filterBadgeCount > 0 ? "default" : "outline"}
            size="icon"
            onClick={onFilterClick}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filtros</span>
            {filterBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                {filterBadgeCount}
              </span>
            )}
          </Button>
        )}
        <div className="flex items-center gap-2">
            <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewChange('list')}
            >
            <List className="h-4 w-4" />
            <span className="sr-only">Vista de Lista</span>
            </Button>
            <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => onViewChange('grid')}
            >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Vista de Cuadrícula</span>
            </Button>
        </div>
      </div>
    </div>
  );
}
