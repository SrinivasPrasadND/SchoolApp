import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '@/constants';
import { storage } from '@/services/storage/persistence';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface PersistedUiPrefs {
  theme: 'light' | 'dark';
  selectedChildId: string | null;
}

interface UiState extends PersistedUiPrefs {
  sidebarOpen: boolean;
  toasts: Toast[];
}

function loadPrefs(): PersistedUiPrefs {
  return (
    storage.get<PersistedUiPrefs>(STORAGE_KEYS.uiPrefs) ?? {
      theme: 'light',
      selectedChildId: null,
    }
  );
}

const prefs = loadPrefs();

const initialState: UiState = {
  theme: prefs.theme,
  selectedChildId: prefs.selectedChildId,
  sidebarOpen: false,
  toasts: [],
};

function persist(state: UiState): void {
  storage.set<PersistedUiPrefs>(STORAGE_KEYS.uiPrefs, {
    theme: state.theme,
    selectedChildId: state.selectedChildId,
  });
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      persist(state);
    },
    setSelectedChild: (state, action: PayloadAction<string | null>) => {
      state.selectedChildId = action.payload;
      persist(state);
    },
    toggleSidebar: (state, action: PayloadAction<boolean | undefined>) => {
      state.sidebarOpen = action.payload ?? !state.sidebarOpen;
    },
    addToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts.push(action.payload);
      },
      prepare: (payload: Omit<Toast, 'id'>) => ({
        payload: { ...payload, id: nanoid() },
      }),
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleTheme, setSelectedChild, toggleSidebar, addToast, dismissToast } =
  uiSlice.actions;
export default uiSlice.reducer;
