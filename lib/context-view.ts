/** A stable, enumerable view of a replaced Vue provider value. */
export function contextView<T extends object>(
  read: () => T | null | undefined,
): T {
  return new Proxy({} as T, {
    get: (_target, key) => Reflect.get(read() ?? {}, key),
    has: (_target, key) => Reflect.has(read() ?? {}, key),
    ownKeys: () => Reflect.ownKeys(read() ?? {}),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(read() ?? {}, key);
      return descriptor ? { ...descriptor, configurable: true } : undefined;
    },
  });
}
