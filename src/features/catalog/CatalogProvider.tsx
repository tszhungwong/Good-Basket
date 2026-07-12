import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createCatalogRepository, type CatalogRepository } from './catalogRepository';
import type { CatalogData } from './catalogTypes';

type CatalogContextValue = {
  data: CatalogData | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
};

type CatalogProviderProps = {
  children: ReactNode;
  repository?: CatalogRepository;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children, repository }: CatalogProviderProps) {
  const repositoryRef = useRef(repository ?? createCatalogRepository());
  const [data, setData] = useState<CatalogData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState(0);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRequestId((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    repositoryRef.current
      .getCatalog()
      .then((catalog) => {
        if (active) {
          setData(catalog);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load the shop catalog. Please try again.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  const value = useMemo(
    () => ({ data, error, loading, retry }),
    [data, error, loading, retry],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider.');
  }

  return context;
}
