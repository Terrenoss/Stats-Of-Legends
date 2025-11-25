"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const SafeLink: React.FC<SafeLinkProps> = ({ href, children, onClick, ...props }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e as any);
    }

    if (e.isDefaultPrevented()) return;
    // allow normal navigation by default
  };

  if (mounted) {
    return (
      <Link href={href} {...(props as any)} onClick={handleClick}>
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
