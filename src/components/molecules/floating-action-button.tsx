
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FloatingActionButtonProps = {
  onClick: () => void;
  icon?: React.ReactNode;
};

export default function FloatingActionButton({ 
  onClick, 
  icon = <Plus className="h-6 w-6" /> 
}: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={onClick}
      >
        {icon}
        <span className="sr-only">Añadir</span>
      </Button>
    </div>
  );
}
