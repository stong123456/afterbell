# EventDecisionRegistry security model

## Scope

`EventDecisionRegistry` is a non-custodial, non-upgradeable evidence registry. It stores commitments to an
off-chain event and decision plan, plus the human owner's terminal decision state. It never holds tokens,
requests approvals, calls routers, verifies prices, or executes trades.

## Trust boundaries

- The owner is the transaction sender that approves the decision.
- `eventHash` and `planHash` are only meaningful if the application hashes a canonical, versioned payload.
- `executionTxHash` is an owner-supplied reference. The registry does not prove that referenced transaction's
  semantics; indexers must verify it independently on the intended execution chain.
- Timestamps and block numbers are chain observations, not wall-clock or oracle guarantees.

## Enforced invariants

1. A receipt ID is domain-separated by a type hash, chain ID, registry address, owner, event hash, plan hash,
   decision kind, and confidence.
2. Empty commitments, zero owners in the ID helper, and confidence above 100 are rejected.
3. Only the receipt owner can transition it.
4. The only valid transitions are `Approved -> Executed` and `Approved -> Cancelled`.
5. Terminal states cannot be changed and an execution hash must be nonzero.
6. Duplicate receipt IDs are rejected; accidental native-token transfers revert.
7. The contract makes no external calls and has no privileged administrator or upgrade path.

## Operational requirements

- Canonical payload schemas must include their own schema version and use Keccak-256 before submission.
- Frontends must display the full plan before wallet signature and must not describe a receipt as trade proof.
- Production trade adapters, if added, must be separate contracts with independent audits, slippage limits,
  token/router allowlists, pause controls, and simulation.
- Mainnet deployment requires an independent third-party audit and explorer source verification.

## Live service controls

- OKX and OpenAI credentials remain server-side Worker environment variables and are never serialized into `/api/config`.
- Cross-origin write requests are rejected, request bodies are bounded, and receipt fields are format-validated.
- A receipt is indexed only after X Layer RPC confirms success, matching sender, and the deployed registry address.
- Upstream calls have abort timeouts; cached snapshots provide bounded resilience without hiding their timestamps.
- AI output is strict-schema, source text is treated as untrusted input, and the model cannot change confidence math,
  position caps, expiry, invalidation rules, wallet destination, or contract calls.
- If all live sources fail before a valid snapshot exists, the UI switches to an explicitly labeled replay.
