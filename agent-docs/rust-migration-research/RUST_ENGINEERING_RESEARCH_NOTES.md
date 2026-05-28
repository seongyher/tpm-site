# Rust Engineering Research Notes

These notes support
[`RUST_ENGINEERING_GUIDE.md`](../RUST_ENGINEERING_GUIDE.md). They are not a
separate policy surface. They record the source-backed reasoning behind the
guide's Rust style and engineering recommendations.

## Research Goal

The goal was to refine TPM's Rust guidance into a practical judgment and style
guide: strict enough to prevent common bug classes, but explicit that patterns
should not be followed mechanically. Rust should help the repo make correct
platform work easy, incorrect states hard to represent, and future CLI, MCP,
Tauri, CI, and studio surfaces safe to evolve together.

## Source Pass

### Rust API Guidelines

Read pages:

1. [About](https://rust-lang.github.io/api-guidelines/about.html)
2. [Checklist](https://rust-lang.github.io/api-guidelines/checklist.html)
3. [Naming](https://rust-lang.github.io/api-guidelines/naming.html)
4. [Interoperability](https://rust-lang.github.io/api-guidelines/interoperability.html)
5. [Macros](https://rust-lang.github.io/api-guidelines/macros.html)
6. [Documentation](https://rust-lang.github.io/api-guidelines/documentation.html)
7. [Predictability](https://rust-lang.github.io/api-guidelines/predictability.html)
8. [Flexibility](https://rust-lang.github.io/api-guidelines/flexibility.html)
9. [Type safety](https://rust-lang.github.io/api-guidelines/type-safety.html)
10. [Dependability](https://rust-lang.github.io/api-guidelines/dependability.html)
11. [Debuggability](https://rust-lang.github.io/api-guidelines/debuggability.html)
12. [Future proofing](https://rust-lang.github.io/api-guidelines/future-proofing.html)
13. [Necessities](https://rust-lang.github.io/api-guidelines/necessities.html)
14. [External links](https://rust-lang.github.io/api-guidelines/external-links.html)

Important implications:

- The API Guidelines explicitly frame themselves as guidelines, not mandates.
  TPM should mirror that: the Rust guide should steer judgment, not create
  rituals.
- Naming, conversion, iterator, getter, and constructor conventions matter
  because future CLI/MCP/Tauri APIs should feel like normal Rust, not a
  project-private dialect.
- Common traits should be implemented eagerly only where semantically correct.
  `Default`, `Display`, `Ord`, and `Serialize` are not automatic; they make
  promises.
- Documentation examples should show why a user wants an API, not merely how
  syntax works. Fallible examples should use `?`, not `unwrap`.
- Predictability argues against out-parameters, surprising `Deref`, overloaded
  operators without obvious meaning, and conversion methods living on the
  wrong type.
- Flexibility supports `AsRef`, `Read`/`Write`, and intermediate result
  exposure where they reduce duplicate work, but not when generics infect data
  types or obscure the domain.
- Type safety directly backs TPM's preference for newtypes, custom argument
  types instead of booleans/options, bitflags for real flag sets, and builders
  for complex construction.
- Dependability says validity should be enforced whenever practical, with
  static enforcement preferred over dynamic checks. This matches the repo goal
  of making impossible states unrepresentable.
- Future proofing supports private fields, sealed traits, and newtypes that
  hide representation details.
- Necessities remind us that public dependencies become part of stable public
  APIs. TPM should keep provider/dependency types out of core operation
  contracts unless that dependency is intentionally part of the contract.

Non-obvious caution:

- The guidelines support newtypes and builders, but not everywhere. Newtypes
  have boilerplate cost; builders are for construction complexity, not for
  every struct. TPM should require a real invariant, ambiguity, or evolution
  pressure.

### Microsoft Pragmatic Rust Guidelines For Agents

Read [all.txt](https://microsoft.github.io/rust-guidelines/agents/all.txt).

Important implications:

- Strong Rust APIs help both humans and agents because the compiler can catch
  misunderstandings.
- Docs, examples, and testability are agent-productivity features.
- Application crates may use broad error helpers, but library/shared crates
  should expose canonical structured errors. TPM's operation-core crates should
  keep structured error and diagnostic contracts, while binary adapters can
  translate at their boundary.
- Avoid weasel names like `Manager`, `Service`, and `Factory`; use names that
  reveal the specific domain responsibility.
- Use `#[expect(..., reason = "...")]` for lint escapes where possible so stale
  escapes become noisy.
- Avoid statics for correctness-sensitive state. This is especially relevant to
  active-site state, provider state, credentials, and diagnostics sinks.
- IO and system calls should be mockable. For TPM, that means pure planning
  functions should be tested directly and impure adapters should be thin.
- Avoid glob re-exports because they leak accidental API surface.
- Use the strongest standard type as early as practical, but do not make public
  numeric APIs weird merely to prove a point.
- Test utilities should be gated or private to tests. This reinforces the repo
  rule against test-only public exports.
- Avoid exposing smart-pointer wrappers in public APIs unless they are the
  point of the API.
- Prefer concrete types first, then generics, then `dyn Trait` only when the
  runtime extension boundary justifies it.
- Complex construction should use builders, but long required-parameter lists
  should first be grouped semantically.

Non-obvious caution:

- Some Microsoft guidance, such as application-level `anyhow` and allocator
  changes, is not automatically right for TPM. The shared operation crates are
  platform/library-like, and our current dependency-light policy is stricter.

### Canonical Rust Best Practices

Read the introduction and relevant discipline pages:

- [Introduction](https://canonical.github.io/rust-best-practices/)
- [Import discipline](https://canonical.github.io/rust-best-practices/import-discipline.html)
- [Pattern matching discipline](https://canonical.github.io/rust-best-practices/pattern-matching-discipline.html)
- [Code discipline](https://canonical.github.io/rust-best-practices/code-discipline.html)
- [Error and panic discipline](https://canonical.github.io/rust-best-practices/error-and-panic-discipline.html)
- [Function discipline](https://canonical.github.io/rust-best-practices/function-discipline.html)
- [Comment discipline](https://canonical.github.io/rust-best-practices/comment-discipline.html)

Important implications:

- A style guide's job is to make collaboration easier and code locally
  consistent. TPM should adapt this framing so the Rust guide improves
  judgment rather than demanding novelty.
- Exhaustive matching should be used to draw future maintainer attention when
  internal states change.
- Tuple indexing should be avoided when names matter. In TPM, structs and
  semantic parameter groups should replace `(source, target, mode)` tuples
  crossing domain boundaries.
- Function signatures should not expose implementation details through
  pattern-matched parameters.
- Struct population is cleaner when names line up; mismatched names often
  reveal muddled concepts.
- Error messages should be concise and written for the expected reader. TPM has
  at least three readers: authors/site owners, developers, and machines.
- Type-erased errors are convenient but weak for maintained library-like code.
  TPM should avoid `Box<dyn Error>`/`anyhow` in shared operation contracts.
- Rustdoc first sentences should describe when to use the item, not merely what
  it mechanically does.

Non-obvious caution:

- Canonical is intentionally opinionated. TPM should keep the guidance that
  aligns with our goals, but not import every formatting preference as a new
  blocking rule.

### Rust Design Patterns

Read the introduction, constructor idiom, newtype pattern, and borrow-clone
anti-pattern.

Important implications:

- Design patterns are reusable tradeoffs; the source explicitly emphasizes why
  a pattern is chosen, not just how to implement it.
- Rust patterns differ from OO patterns because ownership, enums, traits,
  pattern matching, and functional primitives solve many problems directly.
- The constructor idiom supports `new` and `Default` when there is a meaningful
  default.
- The newtype pattern supports type safety, encapsulation, security-sensitive
  display behavior, unit distinctions, and representation hiding.
- Cloning to appease the borrow checker is a signal to inspect ownership and
  API design. Clones can be correct, but they should be deliberate.

Non-obvious caution:

- Newtypes reduce mistaken mixing but increase pass-through boilerplate. Use
  them at boundaries and recurring domain concepts, not around every string.

### Blessed.rs

Read [Blessed.rs crate list](https://blessed.rs/crates).

Important implications:

- Rust's standard library is intentionally not batteries-included; crate
  selection is part of engineering design.
- Blessed.rs is useful for discovering common ecosystem defaults such as
  `clap`, `serde`, `thiserror`, `tracing`, and `tempfile`.
- TPM should treat crate lists as inputs, not approvals. The repo's
  dependency-light, cargo-deny-backed policy remains the source of truth.

Non-obvious caution:

- "Popular" is not enough. A crate must fit our contracts, supply-chain policy,
  cross-platform packaging goals, and future CLI/MCP/Tauri reuse model.

### cheats.rs

Read [cheats.rs](https://cheats.rs/) as a broad reference for Rust syntax,
ownership, conversions, generics, lifetimes, variance, unsafe/soundness, and
performance reminders.

Important implications:

- Rust has precise distinctions between ownership, references, conversions,
  coercions, subtyping, and variance. TPM examples should avoid hand-waving
  around these concepts.
- `From`, `TryFrom`, `AsRef`, `AsMut`, `Borrow`, and `ToOwned` represent
  different promises. Do not implement conversion traits loosely.
- Numeric casts and `as` conversions can be surprising; prefer explicit
  checked or domain constructors where correctness matters.
- Performance work should be benchmark-driven, not a reason for unsafe or
  clever code by default.

### Ferrous Systems Elements Of Rust

Read [elements-of-rust](https://github.com/ferrous-systems/elements-of-rust).

Important implications:

- The stated theme is effectively expressing intent with Rust.
- Relevant patterns for TPM include de-nesting, combating rightward pressure,
  iterator/result handling, write-compile-fix latency, and using blocks for
  clarity.
- This supports TPM's preference for simple, readable Rust even when more
  condensed iterator or trait code is possible.

### mre/idiomatic-rust

Read [idiomatic-rust](https://github.com/mre/idiomatic-rust).

Important implications:

- The collection defines idiomatic style as working with the conventions of the
  language rather than forcing habits from another language.
- It points to resources on defensive programming, avoiding overengineering,
  state machines, enums instead of booleans, error design, documentation, and
  CLI applications.
- This supports using the Rust guide as a living map to good external material,
  not as a closed rule system.

## Synthesized TPM Conclusions

1. The guide must explicitly state that it is a judgment guide. Overzealous
   newtypes, builders, traits, typestate, or generic abstractions can reduce
   velocity and create new bug surfaces.
2. The strongest default pattern for TPM is parse/validate at the edge, pass
   typed normalized values through pure core, and render/apply at thin
   interface adapters.
3. Shared operation crates should avoid type-erased errors in public APIs.
   Interface binaries may translate into simpler application errors, but only
   at the edge.
4. Public structs with raw fields are acceptable only for passive data-transfer
   contracts that cannot represent invalid states or have already been
   normalized.
5. `Default` is appropriate only when a default is semantically true. It is not
   a convenience switch for complex domain values.
6. `Display` should be implemented only when one human representation is
   obvious and safe. Debug and machine rendering are separate.
7. Exhaustive matching is a deliberate future-maintainer signal. Wildcards are
   acceptable only when the grouping is itself policy.
8. Provider, filesystem, command, process, and credential behavior should stay
   in adapters. Core code should plan, validate, normalize, and produce
   structured results.
9. Testability should shape APIs, but not through test-only public exports.
   Use private tests, fixtures, feature-gated test utilities when justified,
   and pure seams.
10. Dependency additions require domain pressure, not convenience alone.

## Patterns To Add To The Guide

- Newtype with validated constructor and private field.
- Enum state model instead of boolean clusters.
- Pure planner plus impure adapter split.
- Diagnostic report construction separated from internal error.
- Provider capability model with explicit unsupported operations.
- CLI handler that only parses, calls operations, and renders.
- Table-driven tests for state/capability behavior.
- Exact JSON contract fixture for machine output.
- Anti-examples for technically valid but policy-misaligned Rust.

## Style-Guide Framing Needed

The guide should open with language like:

> This is not a checklist to satisfy mechanically. It is a set of defaults,
> examples, and review heuristics meant to make correct Rust easier to write
> and easier to recognize. Follow the intent over the letter: use the smallest
> pattern that protects a real invariant, keeps seams clear, and improves
> future change safety.

This framing prevents agents from blindly turning every string into a newtype,
every config into a builder, every boundary into a trait, or every lifecycle
into typestate.
