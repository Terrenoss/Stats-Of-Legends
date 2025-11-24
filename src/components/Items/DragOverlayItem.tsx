"use client";

import React from "react";
import { itemIconUrl } from "@/lib/dd/imageUrl";

export default function DragOverlayItem({
  patch,
  item,
  source,
}: {
  patch: string;
  item: any;
  source: string;
}) {
  if (!item) return null;
  const image =
    item.imageFull ||
    (item.image && (typeof item.image === "string" ? item.image : item.image.full)) ||
    (item.id ? `${item.id}.png` : "");

  return (
    <div
      data-debug="drag-overlay"
      style={{ pointerEvents: "none", zIndex: 10000, minWidth: 160 }}
      className="p-3 bg-slate-700/95 border border-slate-600 rounded shadow-xl flex items-center gap-4 pointer-events-none"
    >
      <img
        src={itemIconUrl(patch || "latest", image)}
        className="w-12 h-12 object-contain"
        alt={item.name}
        onError={(e: any) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = itemIconUrl("latest", image || `${item.id}.png`);
        }}
      />
      <div className="text-sm font-medium">{item.name}</div>
    </div>
  );
}
