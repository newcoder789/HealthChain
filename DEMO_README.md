HealthChain — Demo README

Summary
This build contains a demo UI for HealthChain (ICP + React). The demo shows patient upload, doctor verification, research bounty lifecycle and a simulated token reward distribution (HCT).

Modes
- Demo mode (default): Token flows and some marketplace features are simulated in the frontend.
- Real mode: UI will call backend canister functions where implemented. Toggle is hidden behind the developer overlay (Ctrl+H).

Developer overlay (Ctrl+H)
Use Ctrl+H to open the developer overlay. It highlights:
- Red: Backend-connected components (DO NOT change logic)
- Yellow: Style-only components (OK to restyle)
- Green: Mockable components (demo-only)

Seed Data
Pre-seeded demo accounts and bounties are available. See `/src/Hospital_Chain_frontend/src/data/demo-seed.json`.

Acceptance checklist (what to show to judges)
1. Sign-in & auto-register
2. Patient: Upload --> File visible
3. Doctor: Request verification --> Admin approves --> Badge appears
4. Researcher: Create bounty -> Patient consents -> Compile dataset (mock) -> Tokens distributed (mock)
5. Audit timeline shows actions

Notes
- Do not change any function names or parameters used across the repo.
- Token flows are intentionally mocked for the hackathon demo. We will wire an ICRC-1 ledger later.

