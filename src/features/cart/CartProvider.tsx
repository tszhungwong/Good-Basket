import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { Product } from '@/features/catalog/catalogTypes';

import { cartReducer, getCartSummary, initialCartState } from './cartReducer';
import { cartStorage, type CartStorage } from './cartStorage';
import type { CartLine } from './cartTypes';

type CartContextValue = {
  addProduct: (product: Product) => void;
  clearCart: () => void;
  hydrated: boolean;
  itemCount: number;
  items: CartLine[];
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  storageError: string | null;
  subtotal: number;
};

type CartProviderProps = {
  children: ReactNode;
  storage?: CartStorage;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, storage }: CartProviderProps) {
  const storageRef = useRef(storage ?? cartStorage);
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    storageRef.current
      .load()
      .then((items) => {
        if (active) {
          dispatch({ type: 'hydrate', items });
        }
      })
      .catch(() => {
        if (active) {
          setStorageError('Cart changes will not be saved on this device.');
          dispatch({ type: 'hydrate', items: [] });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    storageRef.current
      .save(state.items)
      .then(() => setStorageError(null))
      .catch(() => setStorageError('Cart changes will not be saved on this device.'));
  }, [state.hydrated, state.items]);

  const addProduct = useCallback((product: Product) => {
    dispatch({ type: 'add', product });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'set-quantity', productId, quantity });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    dispatch({ type: 'remove', productId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'clear' });
  }, []);

  const summary = useMemo(() => getCartSummary(state), [state]);
  const value = useMemo(
    () => ({
      addProduct,
      clearCart,
      hydrated: state.hydrated,
      itemCount: summary.itemCount,
      items: state.items,
      removeProduct,
      setQuantity,
      storageError,
      subtotal: summary.subtotal,
    }),
    [
      addProduct,
      clearCart,
      removeProduct,
      setQuantity,
      state.hydrated,
      state.items,
      storageError,
      summary.itemCount,
      summary.subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }

  return context;
}
