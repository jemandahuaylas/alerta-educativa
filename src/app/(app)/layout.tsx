
import { AppProvider } from "@/context/app-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}
