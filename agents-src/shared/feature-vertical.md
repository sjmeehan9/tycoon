## End-to-End Feature Slicing

Phases are built around individual, rounded, end-to-end features of the larger initiative — each stated as "a user can now …". Components are **vertical slices**: UI + logic + persistence + wiring for one facet of the phase feature — never horizontal layers ("the models", "the services", "the screens"). Infrastructure appears only inside the feature slice that first needs it; Phase 1 is a walking skeleton — the thinnest complete path through the real architecture.

This rule also binds every **split**: when a component is decomposed (upfront, mid-implementation, or via a review split proposal `X.Ya`/`X.Yb`), each part must be a runnable vertical slice with working runtime behaviour for its stated scope — not a layer.

Structural bookends are the only exceptions: Component X.1 of each phase holds the human setup tasks, and the final component of each phase executes the phase validation (UI + critical backend end-to-end testing, documentation updates).
