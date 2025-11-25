
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const SafeLink: React.FC<SafeLinkProps> = ({ href, children, onClick, ...props }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check router availability safely
  let canUseLink = false;
  try {
    useRouter();
    canUseLink = true;
  } catch (e) {
    canUseLink = false;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    
    // If user's onClick prevented default, we respect that (e.g. for SPA state navigation)
    if (e.isDefaultPrevented()) return;

    // If we are not in Next.js router context (e.g. SPA mode) and looking for internal nav,
    // we should ideally prevent default if an onClick handler was supposed to handle it but didn't.
    // However, if no onClick handler prevented default, we assume standard navigation is desired.
    // For AI Studio preview robustness, we prefer allowing standard behavior unless explicitly overridden.
  };

  if (canUseLink && mounted) {
    return (
      <Link href={href} {...props} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} {...props} onClick={handleClick}>
      {children}
    </a>
  );
};
