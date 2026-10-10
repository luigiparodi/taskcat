# Security notes

## Known advisory: braces GHSA-vfj7-8cjw-p6xm (CVE-2026-93687)

`npm audit` reports 7 high-severity findings, all tracing to a single root:

```
shadcn (devDependency)
  -> @shadcn/registry
    -> fast-glob@3.3.3
      -> micromatch@4.0.8
        -> braces@3.0.3  (affected: all versions <= 3.0.3)
```

### Impact
- The `braces` package (through 3.0.3) is vulnerable to a stack-exhaustion
  denial of service when processing deeply nested brace patterns.
- It is reachable **only inside the `shadcn` scaffolding CLI** (used for
  `shadcn add` during development). Nothing in `src/` imports it and it is not
  part of the production bundle.
- `braces` is at its latest published version (3.0.3). The GitHub advisory
  states there is **no patched release available yet**:
  https://github.com/micromatch/braces/issues/70

### Current state
- Pinned via `package.json` `overrides` so the lockfile cannot drift to an
  earlier/higher version unexpectedly.
- `npm audit fix --force` is intentionally NOT used: it proposes downgrading
  `shadcn` 4.21 -> 1.0.0, which is a breaking change that does not address the
  vulnerable code path.

### Action required
- Re-run `npm audit` periodically. When `braces` publishes a version > 3.0.3
  with a depth guard, update `overrides` and remove this note.