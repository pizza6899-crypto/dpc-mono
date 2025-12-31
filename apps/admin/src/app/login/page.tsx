"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "@/components/refine-ui/form/sign-in-form";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";

export default function Login() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const result = await authProviderClient.check();
      
      if (result.authenticated) {
        router.push(result.redirectTo || "/");
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return null; // 또는 로딩 스피너
  }

  return <SignInForm />;
}
