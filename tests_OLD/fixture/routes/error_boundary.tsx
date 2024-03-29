import { Component } from "preact";

class ErrorBoundary extends Component {
  state = { error: null } as { error: Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error
      ? <p>{this.state.error.message}</p>
      : <>{this.props.children}</>;
  }
}

function Thrower(): preact.JSX.Element {
  throw new Error("it works");
}

export default function ErrorBoundaryPage() {
  return (
    <ErrorBoundary>
      <Thrower />
    </ErrorBoundary>
  );
}
