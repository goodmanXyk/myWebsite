"use client";

import React, { useEffect, useState } from "react";
import { Card } from "./Card";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      } bg-black/30 backdrop-blur-sm`}
      onClick={onClose}
    >
      <Card
        className={`w-full max-w-md transition-all duration-150 motion-reduce:transition-none ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-sm text-muted transition-colors hover:text-ink"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}
