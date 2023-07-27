export interface ViewAnimation {
  name: string;
  delay?: number | string;
  duration?: number | string;
  easing?: string;
  fillMode?: string;
  direction?: string;
}

export interface ViewTransitionOpts {
  id: string;
  forward: {
    old: ViewAnimation | ViewAnimation[];
    new: ViewAnimation | ViewAnimation[];
  };
  backward: {
    old: ViewAnimation | ViewAnimation[];
    new: ViewAnimation | ViewAnimation[];
  };
}

declare global {
  namespace preact.createElement.JSX {
    interface HTMLAttributes {
      transition?: ViewTransitionOpts;
    }
  }
}
