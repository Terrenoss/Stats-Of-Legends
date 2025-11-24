'use client';

import React, { useEffect } from 'react';

export default function ClientHydrationCleanup() {
  useEffect(() => {
    try {
      // Remove attributes injected by browser extensions (e.g. bis_register) that trigger React hydration warnings
      const removePrefixed = (root: Document | Element) => {
        // querySelectorAll returns a NodeListOf<Element>; when unavailable we fall back to an empty array.
        const walker: NodeListOf<Element> | Element[] = (root as Element).querySelectorAll ? (root as Element).querySelectorAll('*') as NodeListOf<Element> : [] as Element[];

        // Normalize to an array for safe iteration in TS
        const nodes: Element[] = Array.from(walker as Iterable<Element>);

        nodes.forEach((el: Element) => {
          if (!el.attributes) return;
          const toRemove: string[] = [];
          for (let i = 0; i < el.attributes.length; i++) {
            const name = el.attributes[i].name;
            if (name && (name as string).startsWith && (name as string).startsWith('bis_')) toRemove.push(name);
          }
          toRemove.forEach(n => el.removeAttribute(n));
        });
        // also check html and body
        try { (document.documentElement as any).removeAttribute && (document.documentElement as any).removeAttribute('bis_register'); } catch (e) {}
        try { (document.body as any).removeAttribute && (document.body as any).removeAttribute('bis_register'); } catch (e) {}
      };
      if (typeof window !== 'undefined' && document) removePrefixed(document as any);
    } catch (e) { /* no-op */ }
  }, []);

  return null;
}
