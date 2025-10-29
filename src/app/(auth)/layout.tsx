import { UserProvider } from "@/context/user-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
    </UserProvider>
  );
}
