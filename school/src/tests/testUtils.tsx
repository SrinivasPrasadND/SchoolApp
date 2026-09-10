import { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from '@/app/store';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  store?: ReturnType<typeof makeStore>;
}

/** Render a component wrapped with Redux + Router for integration-style tests. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', store = makeStore(), ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
