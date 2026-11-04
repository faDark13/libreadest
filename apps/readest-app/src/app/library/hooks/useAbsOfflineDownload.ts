import { useCallback } from 'react';
import { transferManager } from '@/services/transferManager';
import type { Book } from '@/types/book';

/**
 * "Download for Offline" on an Audiobookshelf book (#6256). Every book can be
 * queued: this fork has no plans.
 */
export const useAbsOfflineDownload = () => {
  const handleBooksOfflineDownload = useCallback((books: Book[]) => {
    for (const book of books) transferManager.queueAbsOfflineDownload(book, 1);
  }, []);
  const handleBookOfflineDownload = useCallback(
    (book: Book) => handleBooksOfflineDownload([book]),
    [handleBooksOfflineDownload],
  );

  return { handleBookOfflineDownload, handleBooksOfflineDownload, offlinePremiumLabel: undefined };
};
