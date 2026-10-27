import { useEffect } from "react";
import { Loader } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
