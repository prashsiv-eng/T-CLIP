# Security Policy

## Supported versions

Security fixes are applied to the latest release on `main`.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub:
**Security > Report a vulnerability** on this repository.

Include:

- a description of the issue and its impact
- steps to reproduce, or a proof of concept
- affected version or commit

We aim to acknowledge reports within 5 business days and to agree a
disclosure timeline with the reporter.

## Scope

T-CLIP runs entirely client-side. Issues of particular interest include:

- bypasses of capability or role checks
- attestation hash or integrity weaknesses
- injection through imported `checklist.json` files (XSS and similar)
- unintended network calls or data leaving the browser
