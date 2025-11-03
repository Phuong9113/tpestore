"use client";

import React, { useState } from "react";
import ChatBox from "./ChatBox";

export default function ChatDock(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-16 right-6 z-50">
      {open ? (
        <div className="relative">
          <ChatBox onClose={() => setOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          aria-label="Mở trò chuyện"
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block text-2xl leading-none">💬</span>
        </button>
      )}
    </div>
  );
}


