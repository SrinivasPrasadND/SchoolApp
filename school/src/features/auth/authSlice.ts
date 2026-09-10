import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession, User } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { storage } from '@/services/storage/persistence';

interface AuthState {
  session: AuthSession | null;
  status: 'idle' | 'restoring';
}

function loadSession(): AuthSession | null {
  return storage.get<AuthSession>(STORAGE_KEYS.session);
}

const initialState: AuthState = {
  session: loadSession(),
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.session = {
        token: action.payload.token,
        user: action.payload.user,
        issuedAt: Date.now(),
      };
      storage.set(STORAGE_KEYS.session, state.session);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      if (state.session) {
        state.session.user = action.payload;
        storage.set(STORAGE_KEYS.session, state.session);
      }
    },
    logout: (state) => {
      state.session = null;
      storage.remove(STORAGE_KEYS.session);
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
