import { useState, useCallback } from "react";

export const useUnreadCounts = () => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const incrementUnreadCount = useCallback((userId: string) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + 1,
    }));
  }, []);

  const resetUnreadCount = useCallback((userId: string) => {
    setUnreadCounts((prev) => {
      if (!prev[userId]) {
        return prev;
      }
      const { [userId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    unreadCounts,
    incrementUnreadCount,
    resetUnreadCount,
  };
};
