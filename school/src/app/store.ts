import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api/baseApi';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';

// Import endpoint injections so RTK Query registers them before use.
import '@/services/api/endpoints';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

/** Factory used by tests to build an isolated store instance. */
export function makeStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
