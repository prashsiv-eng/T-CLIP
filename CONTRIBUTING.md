# Contributing to T-CLIP

Thanks for your interest in improving T-CLIP. Anyone can contribute.

## Developer Certificate of Origin (DCO)

All contributions must be signed off under the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).
Your sign-off confirms that you wrote the change, or have the right to
submit it under the project's licence.

Add a sign-off line to every commit:

```bash
git commit -s -m "Describe your change"
```

This adds a line such as:

```
Signed-off-by: Your Name <you@example.com>
```

Pull requests with unsigned commits cannot be merged.

## Workflow

1. Open an issue describing the bug or feature, unless the change is trivial.
2. Fork the repo and create a branch from `main`.
3. Run `npm ci`, then `npm run lint`, `npm test` and `npm run build` locally.
4. Add or update tests for any behaviour change.
5. Open a pull request that links the issue.

## Templates

New or updated checklist templates must:

- cite the source standard, its version and its licence in `NOTICE.md`
- respect the source licence (for example, keep CC BY-SA content under CC BY-SA)
- pass the schema validator in `src/schema/validate.ts`

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
