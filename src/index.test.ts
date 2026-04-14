import { venum, match } from './index';

describe('venum', () => {
  describe('venum — variant creation', () => {
    it('should create a variant with tag and data', () => {
      const v = venum('success', { name: 'John' });
      expect(v.tag).toBe('success');
      expect(v.data).toEqual({ name: 'John' });
    });

    it('should create a variant without data', () => {
      const v = venum('loading');
      expect(v.tag).toBe('loading');
      expect(v.data).toBeUndefined();
    });
  });

  describe('exhaustive match', () => {
    function fetchUser(id: number) {
      if (id === 1) return venum('success', { name: 'John' });
      if (id === 0) return venum('notFound', { code: 404 });
      return venum('serverError', { msg: 'Internal error' });
    }

    it('should call the correct handler based on tag', () => {
      const output = match(fetchUser(1), {
        success: (d) => `Hello ${d.name}`,
        notFound: (d) => `Error ${d.code}`,
        serverError: (d) => `Crash: ${d.msg}`,
      });
      expect(output).toBe('Hello John');
    });

    it('should dispatch each variant to its handler', () => {
      expect(match(fetchUser(0), {
        success: (d) => d.name,
        notFound: (d) => `${d.code}`,
        serverError: (d) => d.msg,
      })).toBe('404');

      expect(match(fetchUser(-1), {
        success: (d) => d.name,
        notFound: (d) => `${d.code}`,
        serverError: (d) => d.msg,
      })).toBe('Internal error');
    });

    it('should require all handlers at compile time when _ is absent', () => {
      const r = fetchUser(1);
      // @ts-expect-error - missing 'serverError' handler, no _ provided
      match(r, {
        success: (d: any) => d.name,
        notFound: (d: any) => d.code,
      });
    });
  });

  describe('partial match with _', () => {
    function getStatus(ok: boolean) {
      if (ok) return venum('active', { since: '2024-01-01' });
      return venum('banned', { reason: 'spam' });
    }

    it('should use _ for unhandled variants', () => {
      const output = match(getStatus(false), {
        active: (d) => `Active since ${d.since}`,
        _: (rest) => `Other: ${rest.tag}`,
      });
      expect(output).toBe('Other: banned');
    });

    it('should prefer specific handler over _', () => {
      const output = match(getStatus(true), {
        active: (d) => `Matched: ${d.since}`,
        _: () => 'default',
      });
      expect(output).toBe('Matched: 2024-01-01');
    });

    it('_ receives the full variant with tag and data', () => {
      match(getStatus(false), {
        active: () => 'active',
        _: (rest) => {
          expect(rest.tag).toBe('banned');
          expect(rest.data).toEqual({ reason: 'spam' });
          return 'ok';
        },
      });
    });
  });

  describe('runtime errors', () => {
    it('should throw when no handler matches and no _ provided', () => {
      expect(() => {
        (match as any)(venum('off', null), {
          on: () => 'on',
        });
      }).toThrow(
        'Handler not found for variant "off" and no default \'_\' handler was provided.'
      );
    });
  });

  describe('compile-time type safety', () => {
    function getShape(type: string) {
      if (type === 'c') return venum('circle', { radius: 5 });
      if (type === 's') return venum('square', { side: 4 });
      return venum('triangle', { base: 3, height: 6 });
    }

    it('should infer handler data types — no annotations needed', () => {
      const area = match(getShape('c'), {
        circle: (d) => Math.PI * d.radius ** 2,
        square: (d) => d.side ** 2,
        triangle: (d) => (d.base * d.height) / 2,
      });
      expect(area).toBeCloseTo(78.54, 1);
    });

    it('should catch wrong property access in handler at compile time', () => {
      const s = getShape('c');
      match(s, {
        // @ts-expect-error - 'side' does not exist on circle data { radius: number }
        circle: (d) => d.side,
        square: (d) => d.side,
        triangle: (d) => d.base * d.height,
      });
    });

    it('should require _ or all handlers — no middle ground', () => {
      const s = getShape('s');
      // @ts-expect-error - missing 'triangle', no _ provided
      match(s, {
        circle: (d: any) => d.radius,
        square: (d: any) => d.side,
      });
    });
  });

  describe('typos become types', () => {
    function getResult(ok: boolean) {
      if (ok) return venum('success', { value: 42 });
      return venum('eror', { msg: 'oops' }); // intentional typo
    }

    it('match requires the exact typo in handler', () => {
      const output = match(getResult(false), {
        success: (d) => `${d.value}`,
        eror: (d) => d.msg,
      });
      expect(output).toBe('oops');
    });

    it('should reject the correct spelling when typo is the source of truth', () => {
      const r = getResult(false);
      expect(() => {
        match(r, {
          success: (d: any) => d.value,
          // @ts-expect-error - 'error' doesn't exist, the variant is 'eror'
          error: (d: any) => d.msg,
        });
      }).toThrow();
    });
  });

  describe('practical examples', () => {
    function fetchApi(url: string) {
      if (url === '/users') return venum('ok', { data: 'User data' });
      if (url === '/bad') return venum('clientError', { error: 'Bad request' });
      return venum('serverError', { error: 'Internal error' });
    }

    it('should handle API response with exhaustive match', () => {
      const handle = (r: ReturnType<typeof fetchApi>): string =>
        match(r, {
          ok: (d) => `Success: ${d.data}`,
          clientError: (d) => `Client: ${d.error}`,
          serverError: (d) => `Server: ${d.error}`,
        });

      expect(handle(fetchApi('/users'))).toBe('Success: User data');
      expect(handle(fetchApi('/bad'))).toBe('Client: Bad request');
      expect(handle(fetchApi('/err'))).toBe('Server: Internal error');
    });

    it('should handle API response with fallback _', () => {
      const handle = (r: ReturnType<typeof fetchApi>): string =>
        match(r, {
          ok: (d) => `OK: ${d.data}`,
          _: (rest) => `Error (${rest.tag})`,
        });

      expect(handle(fetchApi('/users'))).toBe('OK: User data');
      expect(handle(fetchApi('/bad'))).toBe('Error (clientError)');
      expect(handle(fetchApi('/err'))).toBe('Error (serverError)');
    });
  });
});
