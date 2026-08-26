import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

type PageResult<T> = {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | undefined;
  hasMore: boolean;
};

/**
 * Drives a cursor-paginated Firestore list with simple prev/next semantics
 * for the UI, by caching each page's starting cursor as the user moves
 * forward (Firestore only supports "startAfter", not arbitrary offsets).
 */
export function usePaginatedQuery<T>(
  fetchPage: (pageSize: number, cursor?: QueryDocumentSnapshot<DocumentData>) => Promise<PageResult<T>>,
  pageSize = 8,
  deps: unknown[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const cursors = useRef<Array<QueryDocumentSnapshot<DocumentData> | undefined>>([undefined]);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const cursor = cursors.current[targetPage - 1];
      const result = await fetchPage(pageSize, cursor);
      setItems(result.items);
      setHasMore(result.hasMore);
      cursors.current[targetPage] = result.lastDoc;
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    cursors.current = [undefined];
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    items,
    page,
    hasMore,
    loading,
    next: () => load(page + 1),
    prev: () => load(Math.max(1, page - 1)),
    reload: () => load(page),
  };
}
