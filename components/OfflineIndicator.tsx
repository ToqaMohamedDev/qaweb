"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { offlineManager } from "@/lib/offline";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const wasOfflineRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initialStatus = !offlineManager.getOnlineStatus();
    setIsOffline(initialStatus);
    wasOfflineRef.current = initialStatus;

    const unsubscribe = offlineManager.onStatusChange((isOnline) => {
      const nowOffline = !isOnline;
      setIsOffline(nowOffline);

      // Show "connected" message only when transitioning from offline to online
      if (!nowOffline && wasOfflineRef.current) {
        setShowOnlineMessage(true);

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Hide the message after 3 seconds
        timeoutRef.current = setTimeout(() => {
          setShowOnlineMessage(false);
        }, 3000);
      }

      wasOfflineRef.current = nowOffline;
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          dir="rtl"
        >
          <WifiOff className="h-5 w-5" />
          <span className="text-sm font-semibold">أنت غير متصل بالإنترنت</span>
        </motion.div>
      )}
      {showOnlineMessage && !isOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          dir="rtl"
        >
          <Wifi className="h-5 w-5" />
          <span className="text-sm font-semibold">تم الاتصال بالإنترنت</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
