import { useContext } from 'preact/hooks';

import { createContext } from 'preact';


export const ROUTE_CONTEXT = createContext<string>('/');

export function useRoute() {
  try {
    return useContext(ROUTE_CONTEXT);
  } catch (err) {
    throw new Error('useRoute not available.', { cause: err });
  }
}