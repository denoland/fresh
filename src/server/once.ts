export function once<R>(fn: () => R): () => R {
  let main = () => {
    const value = fn();
    main = () => value;
    return value;
  };
  return () => main();
}
