export function venum<T extends string>(tag: T): { readonly tag: T; readonly data: undefined };
export function venum<T extends string, D>(tag: T, data: D): { readonly tag: T; readonly data: D };
export function venum(tag: string, data?: any) {
  return { tag, data };
}

export function match<
  V extends { tag: string; data?: any },
  H extends Partial<{ [K in V['tag']]: (data: Extract<V, { tag: K }>['data']) => any }> & {
    _: (rest: Exclude<V, { tag: Exclude<keyof H, '_'> }>) => any
  }
>(val: V, handlers: H): ReturnType<NonNullable<H[keyof H]>>;

export function match<
  V extends { tag: string; data?: any },
  H extends { [K in V['tag']]: (data: Extract<V, { tag: K }>['data']) => any }
>(val: V, handlers: H): ReturnType<H[keyof H]>;

export function match(val: any, handlers: any) {
  const handler = handlers[val.tag];
  if (handler !== undefined) return handler(val.data);
  if ('_' in handlers && handlers._ !== undefined) return handlers._(val);
  throw new Error(
    `Handler not found for variant "${val.tag}" and no default '_' handler was provided.`
  );
}
