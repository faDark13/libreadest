import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { Book } from '@/types/book';

const queueAbsOfflineDownload = vi.hoisted(() => vi.fn(() => 'transfer-1'));

vi.mock('@/services/transferManager', () => ({
  transferManager: { queueAbsOfflineDownload },
}));

const { useAbsOfflineDownload } = await import('@/app/library/hooks/useAbsOfflineDownload');

const book = { hash: 'h1', format: 'ABS', title: 'Alice' } as Book;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAbsOfflineDownload', () => {
  it('queues the download for everyone', () => {
    const { result } = renderHook(() => useAbsOfflineDownload());

    expect(result.current.offlinePremiumLabel).toBeUndefined();
    result.current.handleBookOfflineDownload(book);

    expect(queueAbsOfflineDownload).toHaveBeenCalledWith(book, 1);
  });

  it('queues every book of a bulk download', () => {
    const other = { hash: 'h2', format: 'ABS', title: 'Bob' } as Book;
    const { result } = renderHook(() => useAbsOfflineDownload());

    result.current.handleBooksOfflineDownload([book, other]);

    expect(queueAbsOfflineDownload).toHaveBeenCalledWith(book, 1);
    expect(queueAbsOfflineDownload).toHaveBeenCalledWith(other, 1);
  });
});
