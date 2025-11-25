
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export const useSafeNavigation = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  let router: ReturnType<typeof useRouter> | null = null;
  let pathname = null;
  let searchParams = null;

  try {
    // Attempt to get Next.js router context
    router = useRouter();
    pathname = usePathname();
    searchParams = useSearchParams();
  } catch (e) {
    // Fallback for environments where Next.js context is missing
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const push = useCallback((href: string) => {
    if (router) {
      try {
        router.push(href);
      } catch (e) {
        console.warn("Router push failed:", e);
        // Fallback to window navigation if router fails
        if (typeof window !== 'undefined') {
          window.location.href = href;
        }
      }
    } else if (typeof window !== 'undefined') {
      // In SPA mode without router, simple location assignment
      // preventDefault should be handled by the caller if they want SPA transition via state
      window.location.href = href;
    }
  }, [router]);

  const safePathname = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');

  return {
    router,
    pathname: safePathname,
    searchParams,
    push,
    isMounted
  };
};
