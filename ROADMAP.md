# T-CLIP Roadmap

> Draft. Maintainers should review and update this file.

## v0.1 (current)
- Local-first checklist engine with schema-driven `checklist.json`
- 5-tier capability model (observer to editor)
- SHA-256 attestation export
- Bundled templates: OWASP ASVS, LLM Top 10, Agentic AI, LLMSVS, NIST AI RMF, CSA CAIQ

## v0.2
- First tagged GitHub release, with a hosted demo on GitHub Pages
- CLI or GitHub Action that verifies `checklist-attestation.json` in CI
- Published JSON Schema for `checklist.json` and the attestation format
- Update the ASVS template to ASVS 5.0

## v0.3
- Signed attestations (for example Sigstore, or a WebCrypto key pair)
- Template diffing for when a standard's version changes
- Accessibility (WCAG 2.2 AA) review

## v1.0
- Stable file-format specification
- Community template library and contribution guide
- Security review of the attestation model
