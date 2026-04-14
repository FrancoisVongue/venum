<div align="center">

# venum

**Tiny tagged unions for TypeScript.**<br>
Two functions. Zero dependencies. Full type inference.

[![npm version](https://img.shields.io/npm/v/venum?color=cb0000&label=npm)](https://www.npmjs.com/package/venum)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/venum?color=364fc7&label=size)](https://bundlephobia.com/package/venum)
[![license](https://img.shields.io/npm/l/venum?color=228b22)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](./package.json)
[![npm downloads](https://img.shields.io/npm/dm/venum?color=cb0000)](https://www.npmjs.com/package/venum)

</div>

---

```bash
npm install venum
```

## Why

TypeScript can infer union types from function return types. You don't need to declare them upfront.

`venum` gives you two functions:

- **`venum(tag, data?)`** — creates a tagged variant. TypeScript captures the exact literal tag.
- **`match(variant, handlers)`** — exhaustive pattern matching with full type inference.

No schemas. No boilerplate. No dependencies. **The producer is the source of truth.**

## Quick start

```typescript
import { venum, match } from 'venum';

function fetchUser(id: number) {
  if (id === 1) return venum('success', { name: 'John' });
  if (id === 0) return venum('notFound', { code: 404 });
  return venum('serverError', { msg: 'oops' });
}

// TypeScript infers the full union automatically:
// ReturnType<typeof fetchUser> =
//   | { readonly tag: 'success';     readonly data: { name: string } }
//   | { readonly tag: 'notFound';    readonly data: { code: number } }
//   | { readonly tag: 'serverError'; readonly data: { msg: string } }

const result = fetchUser(1);

const output = match(result, {
  success:     (d) => `Hello ${d.name}`,
  notFound:    (d) => `Error ${d.code}`,
  serverError: (d) => `Crash: ${d.msg}`,
});
// output: "Hello John"
```

## Exhaustive match

All tags must be handled. Missing one is a **compile-time error**.

```typescript
// ✅ All handlers present — compiles fine
match(result, {
  success:     (d) => d.name,
  notFound:    (d) => d.code,
  serverError: (d) => d.msg,
});

// ❌ TS Error: missing 'serverError' handler
match(result, {
  success:  (d) => d.name,
  notFound: (d) => d.code,
});
```

## Partial match with `_`

Handle some tags explicitly, catch the rest with `_`:

```typescript
match(result, {
  success: (d) => `OK: ${d.name}`,
  _: (rest) => `Something went wrong (${rest.tag})`,
});
```

`_` receives the **full variant** `{ tag, data }` of whatever wasn't explicitly handled. TypeScript narrows the rest type automatically.

## Recursive match

Use `venum` inside `match` handlers to group, transform, or chain unions:

```typescript
function processOrder(id: number) {
  if (id === 1) return venum('paid',      { amount: 100 });
  if (id === 2) return venum('shipped',   { tracking: 'TR-123' });
  if (id === 3) return venum('cancelled',  { reason: 'user request' });
  return              venum('refunded',   { amount: 50 });
}

// Level 1: 4 variants → 2 groups
function classify(order: ReturnType<typeof processOrder>) {
  return match(order, {
    paid:      (d) => venum('active', { detail: `paid $${d.amount}` }),
    shipped:   (d) => venum('active', { detail: `tracking: ${d.tracking}` }),
    cancelled: (d) => venum('closed', { detail: `cancelled: ${d.reason}` }),
    refunded:  (d) => venum('closed', { detail: `refunded $${d.amount}` }),
  });
}

// Level 2: match on the grouped result
function summarize(order: ReturnType<typeof processOrder>) {
  return match(classify(order), {
    active: (d) => `[ACTIVE] ${d.detail}`,
    closed: (d) => `[CLOSED] ${d.detail}`,
  });
}

summarize(processOrder(1)); // "[ACTIVE] paid $100"
summarize(processOrder(3)); // "[CLOSED] cancelled: user request"
```

TypeScript infers types through every level — no annotations needed.

## Typing function parameters

Use `ReturnType` — no custom type utilities needed:

```typescript
type UserResult = ReturnType<typeof fetchUser>;

function handleResult(r: UserResult): string {
  return match(r, {
    success:     (d) => d.name,
    notFound:    (d) => `${d.code}`,
    serverError: (d) => d.msg,
  });
}
```

## Variants without data

```typescript
const loading = venum('loading');
// { readonly tag: 'loading'; readonly data: undefined }
```

## How it works

`venum` is a generic function `<T extends string, D>(tag: T, data?: D)`. The `T extends string` constraint forces TypeScript to capture the **exact literal** — `'success'`, not `string`.

When a function returns different `venum()` calls, TypeScript unions them into a discriminated union. `match` uses mapped types + `Extract` to infer the correct data type for each handler.

**The entire library is ~25 lines:**

```typescript
export function venum<T extends string>(tag: T): { readonly tag: T; readonly data: undefined };
export function venum<T extends string, D>(tag: T, data: D): { readonly tag: T; readonly data: D };
export function venum(tag: string, data?: any) {
  return { tag, data };
}

export function match(val: any, handlers: any) {
  const handler = handlers[val.tag];
  if (handler !== undefined) return handler(val.data);
  if ('_' in handlers && handlers._ !== undefined) return handlers._(val);
  throw new Error(
    `Handler not found for variant "${val.tag}" and no default '_' handler was provided.`
  );
}
```

## API

### `venum(tag)` / `venum(tag, data)`

Creates a tagged variant `{ readonly tag: T; readonly data: D }`.

| Param | Type | Description |
|-------|------|-------------|
| `tag` | `string` | Tag literal. TypeScript captures the exact string. |
| `data` | `any` | Optional. Associated data for the variant. |

### `match(variant, handlers)`

Pattern matches on a tagged variant.

| Param | Type | Description |
|-------|------|-------------|
| `variant` | `{ tag, data }` | The variant to match on. |
| `handlers` | `object` | An object mapping tags to handler functions. |

- **Exhaustive**: provide a handler for every tag. Missing one → compile-time error.
- **Partial**: provide some handlers + `_` default. `_` receives the remaining variant.
- **Runtime**: throws if no handler matches and no `_` is provided.

## Star History

<a href="https://star-history.com/#FrancoisVongue/venum&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=FrancoisVongue/venum&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=FrancoisVongue/venum&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=FrancoisVongue/venum&type=Date" />
 </picture>
</a>

## License

[MIT](./LICENSE)
