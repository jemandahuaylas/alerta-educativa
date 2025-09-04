import { AppProvider } from "@/context/app-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex items-center justify-center min-h-screen bg-background">
        {children}
      </div>
    </AppProvider>
  );
}
