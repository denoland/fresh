// islands/Dropdown.tsx
import { ComponentChildren, createContext } from "preact";
import { StateUpdater, useState } from "preact/hooks";

const DropdownContext = createContext<[boolean, StateUpdater<boolean>]>(
  [false, () => {}],
);

export default function Dropdown(
  { children }: { children: ComponentChildren },
) {
  return (
    <DropdownContext.Provider value={useState(false)}>
      {children}
    </DropdownContext.Provider>
  );
}

export function DropdownHandle(
  { children }: { children: ComponentChildren },
) {
  return (
    <DropdownContext.Consumer>
      {([isMenuOpen, setIsMenuOpen]) => {
        return (
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            {children}
          </button>
        );
      }}
    </DropdownContext.Consumer>
  );
}

export function DropdownMenu({ children }: { children: ComponentChildren }) {
  return (
    <DropdownContext.Consumer>
      {([isMenuOpen]) => {
        if (isMenuOpen) {
          return children;
        }
        return null;
      }}
    </DropdownContext.Consumer>
  );
}
