import { Component, Suspense, useEffect, useState } from "react";

export default function Index() {
  return (
    <ErrorBoundary>
      <Suspense fallback="Loading..">
        <ThingThatSuspends />
      </Suspense>
    </ErrorBoundary>
  );
}

// This should catch any error and render a fallback UI.
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (error !== null) {
      return "Whoops!";
    }
    return this.props.children;
  }
}

// NOTE Wrapping the suspending component in this one will only render it on the client.
// That does not change the behavior of the bug so I've left it out.
// In other words, the bug does not seem to be specific to server rendering or hydration.
function RenderChildrenAfterMounting({ children }) {
  const [didMount, setDidMount] = useState(false);
  useEffect(() => setDidMount(true), []);
  return didMount ? children : null;
}

function ThingThatSuspends({ children }) {
  // NOTE This value has to come after a suspend in order to trigger the case.
  // If we use the same value without first suspending, the error boundary works as expected.
  let value = fakeSuspense();

  // NOTE If I slice the array before mapping, so there are fewer errors, the boundary works.
  // value = value.slice(0, 5);

  return value.map(index => <ThingThatThrows key={index} />);
}

function ThingThatThrows() {
  throw Error("I am an intentional error");
}

// This is just a cheapy fake Suspense.
let inFlightPromise = null;
let resolvedValue = null;
function fakeSuspense() {
  if (resolvedValue === null) {
    if (!inFlightPromise) {
      inFlightPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolvedValue = new Array(100).fill(true).map((_, index) => index);

          resolve();
        }, 100);
      });
    }
    throw inFlightPromise;
  }
  return resolvedValue;
}
