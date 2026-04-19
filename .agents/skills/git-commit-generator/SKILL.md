---
name: git-commit-generator
description: >
  Decomposes uncommitted changes (staged, unstaged, and untracked) into clean,
  layered, reviewable commits ordered from foundational to integrative. Optionally
  collapses existing branch commits into uncommitted changes first, enabling full
  commit history cleanup. This skill should be used when creating git commits,
  writing commit messages, preparing to commit changes, or when the user says
  "structured commits", "clean up my changes", "break this into commits",
  "make my changes reviewable", or asks to organize uncommitted work into a
  logical commit sequence. Also use when the user mentions wanting commits that
  "tell a story" or requests help splitting a large set of changes into smaller,
  incremental commits. Also triggers for PR preparation: "create a PR",
  "prepare PR", "write PR description", "PR title", or "squash-merge message".
  Also triggers for commit history cleanup: "clean up commits", "redo my commits",
  "reorganize commits", "rewrite commit history", or "squash and restage".
---

# Structured Commits

Decompose uncommitted changes (staged, unstaged, and untracked) into a sequence of
clean, layered commits. Each commit should be independently reviewable, and the full
sequence should read as a narrative of how the feature was built — from foundations
to integration.

Optionally, this skill can also collapse existing branch commits into uncommitted
changes first — effectively letting you redo your commit history from scratch using
the structured layering approach.

## Procedure

### Phase 0 — Optional: Collapse Existing Branch Commits

Before looking at uncommitted changes, offer the user the option to collapse their
existing branch commits into uncommitted changes. This is useful when the user has
already committed work on a feature branch but wants to redo their commit history
from scratch.

**Skip this phase entirely** if the user has explicitly said they only want to
organize uncommitted changes, or if there are no branch-specific commits (i.e.,
HEAD equals the merge-base with the target branch).

1. Detect the default branch and count branch-specific commits:
   ```
   DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
   if [ -z "$DEFAULT_BRANCH" ]; then
     DEFAULT_BRANCH="main"
   fi
   MERGE_BASE=$(git merge-base HEAD origin/$DEFAULT_BRANCH)
   BRANCH_COMMITS=$(git rev-list --count $MERGE_BASE..HEAD)
   ```

2. If `BRANCH_COMMITS` is greater than 0, ask the user:
   > "I see **{BRANCH_COMMITS} commit(s)** on this branch since diverging from
   > `{DEFAULT_BRANCH}`. Would you like to collapse them into uncommitted changes
   > so I can re-organize and re-commit everything from scratch?
   >
   > This will `git reset --soft` back to the merge-base, turning all your
   > committed work into staged changes. Your working-tree modifications (if any)
   > will be preserved on top.
   >
   > **Yes** — collapse commits and re-organize everything
   > **No** — skip this and only organize uncommitted changes"

3. If the user says **No** (or if `BRANCH_COMMITS` is 0), skip to Phase 1.

4. If the user says **Yes**:

   a. Record the current HEAD for recovery:
      ```
      PRE_RESET_HEAD=$(git rev-parse HEAD)
      ```

   b. Create a safety backup capturing **all** changes (committed + uncommitted +
      untracked) relative to the merge-base in a single patch:
      ```
      TIMESTAMP=$(date +%s)
      git add -A
      git diff --cached --binary $MERGE_BASE > /tmp/structured-commits-branch-backup-$TIMESTAMP.patch
      git reset HEAD
      ```
      `git add -A` stages everything (uncommitted and untracked files included).
      `git diff --cached --binary $MERGE_BASE` then captures the full delta from
      the merge-base to the current working-tree state. `git reset HEAD` restores
      the index to match HEAD so we don't alter the user's staging state before
      the soft reset.

   c. Soft-reset to the merge-base so all committed changes become staged:
      ```
      git reset --soft $MERGE_BASE
      ```
      After this, HEAD points to the merge-base. All changes from the collapsed
      commits are now staged. Any previously unstaged or untracked changes are
      also present in the working tree on top of the staged changes.

   d. Report to the user:
      > "Collapsed {BRANCH_COMMITS} commit(s) into staged changes. HEAD is now at
      > `{MERGE_BASE_SHORT}`. A backup patch is saved at
      > `/tmp/structured-commits-branch-backup-$TIMESTAMP.patch`.
      > Proceeding to organize all changes into structured commits."

   e. Proceed directly to Phase 1, which will detect these now-uncommitted changes
      and continue the normal flow. Note that `ORIGINAL_HEAD` in Phase 1 will be
      set to the merge-base (the new HEAD after soft reset), and the recovery in
      the Recovery section can use `PRE_RESET_HEAD` to fully restore the original
      state if needed.

### Phase 1 — Snapshot and Unstage

1. Record the current HEAD so we have a safe rollback point:
   ```
   ORIGINAL_HEAD=$(git rev-parse HEAD)
   TIMESTAMP=${TIMESTAMP:-$(date +%s)}
   ```
   If Phase 0 was used, also preserve `PRE_RESET_HEAD` for full recovery.

2. Detect the current state of uncommitted changes:
   ```
   STAGED=$(git diff --cached --name-only | wc -l)
   UNSTAGED=$(git diff --name-only | wc -l)
   UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)
   ```
   Report to the user what was found, e.g.:
   > "Found 3 staged files, 2 unstaged files, and 1 untracked file."

   If all counts are zero **and** Phase 0 was skipped or declined, stop and tell
   the user there's nothing uncommitted to work with.

3. Stage everything so the full set of changes is captured in one snapshot:
   ```
   git add -A
   ```

4. Create a backup patch of all uncommitted changes against HEAD:
   ```
   git diff --cached --binary > /tmp/structured-commits-backup-$TIMESTAMP.patch
   ```

5. Confirm with the user before proceeding:
   > "I've saved a backup patch at `/tmp/structured-commits-backup-$TIMESTAMP.patch`
   > covering all staged, unstaged, and untracked changes. I'm about to unstage
   > everything so I can re-commit in layers. Ready to proceed?"

6. Unstage everything so all changes are working-tree modifications:
   ```
   git reset HEAD
   ```
   HEAD stays exactly where it is. All uncommitted work is now unstaged in the
   working tree, ready to be selectively staged and committed layer by layer.

### Phase 2 — Analyze and Classify

Read every changed file and classify each change into a **dependency layer**.
Build a commit plan as an ordered list before touching git.

Think about the changes through this lens:

- **What can exist on its own with zero imports from other changed files?**
  That is Layer 0 — types, enums, constants, interfaces.
- **What depends only on Layer 0?**
  That is Layer 1 — DTOs, hooks, utility functions, base components.
- **What depends on Layer 0 + Layer 1?**
  That is Layer 2 — services, composed components, business logic.
- **What wires everything together?**
  That is the top layer — controllers, page-level components, route definitions, barrel exports.

Within a layer, group changes that are **logically cohesive** — i.e., a type and its
closely related DTO might go in one commit if they only make sense together.

Present the commit plan to the user as a numbered list:
```
Proposed commit sequence:
1. feat(booking): define BookingAvailability and TimeSlot types
2. feat(booking): add useAvailability hook for fetching time slot data
3. feat(booking): build TimeSlotCard component for rendering a slot
4. feat(booking): assemble BookingPage with hook and TimeSlotCards
```

Wait for the user to approve or adjust the plan before committing.

### Phase 3 — Commit Layer by Layer

For each planned commit, stage only the relevant files and hunks:

- Prefer `git add <file>` for files that belong entirely to one commit.
- Use `git add -p <file>` (interactive patch staging) when a single file contains
  changes spanning multiple layers. Stage only the hunks for the current layer.
- After staging, verify with `git diff --cached --stat` that only intended changes
  are included.
- Commit using **Conventional Commits** format: `<type>[optional scope]: <description>`.
  The subject line should tell the story of what this layer contributes to the
  feature — a reviewer skimming `git log` should understand what the commit does
  and why it exists as a building block. Include technical filenames or identifiers
  where they add clarity.
  ```
  git commit -m "feat(booking): define BookingAvailability and TimeSlot types

  Adds src/types/booking.ts with the interfaces consumed by the hook,
  card component, and page introduced in later commits."
  ```
  Format: `type(scope): subject` under 72 chars, imperative mood, lowercase.
  Add a body separated by a blank line when the reviewer needs context on a
  design decision or to understand how this commit fits into the larger feature.

After all planned commits are applied, run `git diff` to confirm the working tree
is clean. If residual changes remain, ask the user how to handle them.

### Phase 4 — Verify

1. Run `git log --oneline $ORIGINAL_HEAD..HEAD` and present the final commit list.
2. Diff the new commits against the backup patch to confirm nothing was lost:
   ```
   git diff --binary $ORIGINAL_HEAD HEAD > /tmp/structured-commits-result-$TIMESTAMP.patch
   diff /tmp/structured-commits-backup-$TIMESTAMP.patch /tmp/structured-commits-result-$TIMESTAMP.patch
   ```
3. If the patches differ, warn the user and explain what's missing or extra.

### Phase 5 — PR Title & Description

Synthesize the layered commits into a single PR title and description. This is
critical because **squash-merge uses the PR title as the final commit message** —
so the PR title must be a well-crafted conventional commit in its own right.

1. **Title** — Write in Conventional Commits format: `type(scope): description`.
   - Under 72 characters, imperative mood, lowercase after the colon.
   - Focus on the **business outcome**, not the technical changes. The diff is
     right there for engineers to read — the title should explain *why* this
     change exists, not *what* files were touched.
   - Example: `feat(booking): add booking availability page with time slot selection`
     not `feat: add types, hook, component, and page files`.

2. **Description body** — Structure as:
   - A brief sentence or two explaining *why* this change exists (business context,
     user problem being solved, or product goal being advanced).
   - A bullet list summarizing what the layered commits accomplish at a high level.
     Do not dump commit messages verbatim — synthesize them into a coherent summary
     a reviewer can scan in seconds.
   - Reference tickets or issues only if confident they are correct.
   - End with the `Co-Authored-By` trailer.

3. Present the PR title and description to the user for approval, just like
   the commit plan.

4. After the user approves, clean up temporary files:
   ```
   rm -f /tmp/structured-commits-backup-$TIMESTAMP.patch /tmp/structured-commits-result-$TIMESTAMP.patch /tmp/structured-commits-branch-backup-$TIMESTAMP.patch
   ```

5. If Phase 0 was used (commit history was collapsed), remind the user:
   > "Since we rewrote the commit history on this branch, you'll need to force-push
   > to update the remote:
   > ```
   > git push --force-with-lease
   > ```"

## Recovery

If anything goes wrong at any point:

**If Phase 0 was NOT used** (no commit history collapse):
```
git reset --hard $ORIGINAL_HEAD
git apply /tmp/structured-commits-backup-$TIMESTAMP.patch
```
This restores the working tree to exactly the state it was in before the skill ran.

**If Phase 0 WAS used** (commits were collapsed):

Option A — Restore original commits (loses any uncommitted changes that existed
before Phase 0):
```
git reset --hard $PRE_RESET_HEAD
```

Option B — Restore all code as uncommitted changes from the merge-base (use this
if you want to re-run the skill or if Option A doesn't fully recover):
```
git reset --hard $MERGE_BASE
git apply /tmp/structured-commits-branch-backup-$TIMESTAMP.patch
```
The branch backup patch contains the full delta (committed + uncommitted + untracked
changes) from the merge-base, so `git apply` on a clean merge-base checkout
reproduces the complete working-tree state.

Always remind the user which backup patches exist if an error occurs.

---

## Example A — Frontend Feature (React)

Scenario: user built a new "Booking Availability" page with types, a custom hook,
a card component, and a page that assembles them.

**Changed files:**
```
src/types/booking.ts
src/hooks/useAvailability.ts
src/components/TimeSlotCard.tsx
src/components/TimeSlotCard.module.css
src/pages/BookingPage.tsx
```

**Commit plan:**
| #  | Layer   | Commit message                                                                     | Files                                          |
|----|---------|------------------------------------------------------------------------------------|-------------------------------------------------|
| 1  | Types   | feat(booking): define BookingAvailability and TimeSlot types                        | `src/types/booking.ts`                          |
| 2  | Hooks   | feat(booking): add useAvailability hook for fetching time slot data                 | `src/hooks/useAvailability.ts`                  |
| 3  | Base UI | feat(booking): build TimeSlotCard component for rendering a slot                   | `src/components/TimeSlotCard.tsx`, `.module.css` |
| 4  | Page    | feat(booking): assemble BookingPage with hook and TimeSlotCards                     | `src/pages/BookingPage.tsx`                      |

**Why this order:** Each commit compiles and is reviewable on its own. Commit 2
imports from commit 1. Commit 3 imports from commits 1 + 2. Commit 4 imports from
all three. A reviewer can look at commit 1 in isolation and fully understand the
data model before seeing how it's consumed.

**PR title & description:**
```
feat(booking): add booking availability page with time slot selection

Enable users to browse and select available time slots for booking.
Introduces the domain types, a data-fetching hook, a slot card component,
and the page that assembles them.

- Define BookingAvailability and TimeSlot domain types
- Add useAvailability hook for fetching slot data
- Build TimeSlotCard component with styling
- Assemble BookingPage wiring hook and cards together

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Example B — Backend Feature (NestJS)

Scenario: user added a new "Experience Availability" CRUD feature with types,
DTOs, a Prisma model change, service-layer CQRS handlers, and a controller.

**Changed files:**
```
src/types/availability.types.ts
src/availability/dto/create-availability.dto.ts
src/availability/dto/update-availability.dto.ts
prisma/schema.prisma
prisma/migrations/20250319_add_availability/migration.sql
src/availability/commands/create-availability.handler.ts
src/availability/queries/get-availability.handler.ts
src/availability/availability.service.ts
src/availability/availability.controller.ts
src/availability/availability.module.ts
```

**Commit plan:**
| #  | Layer      | Commit message                                                                                    | Files                                                          |
|----|------------|---------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| 1  | Types      | feat(availability): define ExperienceAvailability and TimeSlot interfaces                          | `src/types/availability.types.ts`                              |
| 2  | DTOs       | feat(availability): add create and update DTOs for request validation                              | `src/availability/dto/create-availability.dto.ts`, `update-…`  |
| 3  | Model      | feat(availability): add ExperienceAvailability table to Prisma schema                              | `prisma/schema.prisma`, `prisma/migrations/…`                  |
| 4  | Service    | feat(availability): implement create and get handlers using CQRS pattern                           | `commands/create-availability.handler.ts`, `queries/…`, `.service.ts` |
| 5  | Controller | feat(availability): expose availability endpoints via NestJS controller                            | `.controller.ts`, `.module.ts`                                 |

**Why this order:** Types are pure definitions with no imports. DTOs depend on
types. The Prisma model is an independent schema change. Service handlers depend
on types + DTOs + model. The controller wires everything into NestJS's DI and
depends on all layers below it. A reviewer can approve the data model (commits 1-3)
before looking at business logic (commit 4) and wiring (commit 5).

**PR title & description:**
```
feat(availability): add experience availability CRUD endpoints

Expose create/read endpoints for experience availability so the frontend
can display and manage bookable time slots. Includes Prisma schema,
validation DTOs, CQRS handlers, and NestJS controller.

- Define ExperienceAvailability and TimeSlot interfaces
- Add create/update DTOs with class-validator decorators
- Add ExperienceAvailability table and migration to Prisma schema
- Implement create and get handlers using CQRS pattern
- Expose REST endpoints via NestJS controller and module

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Example C — Commit History Cleanup (Phase 0)

Scenario: user has been working on a feature branch with messy, incremental commits.
They want to clean up their commit history before opening a PR.

**Existing commits on branch (5 commits since `main`):**
```
a1b2c3d wip: trying new approach
d4e5f6a fix: forgot to add types
7g8h9i0 add service and controller
j1k2l3m fix lint errors
n4o5p6q more fixes and cleanup
```

**Phase 0 interaction:**
> "I see **5 commit(s)** on this branch since diverging from `main`. Would you like
> to collapse them into uncommitted changes so I can re-organize and re-commit
> everything from scratch?"

User says **Yes**. The skill runs `git reset --soft $MERGE_BASE`, collapsing all
5 commits into staged changes. Then Phases 1–5 proceed normally, producing:

**New commit plan:**
| #  | Layer      | Commit message                                                            | Files                                    |
|----|------------|---------------------------------------------------------------------------|------------------------------------------|
| 1  | Types      | feat(notifications): define NotificationPreference and Channel types      | `src/types/notifications.ts`             |
| 2  | Service    | feat(notifications): add NotificationService with channel routing logic   | `src/services/notification.service.ts`   |
| 3  | Controller | feat(notifications): expose preference CRUD via REST controller           | `src/controllers/notification.controller.ts`, `.module.ts` |

**Result:** 5 messy commits replaced with 3 clean, layered commits that tell a
coherent story. The user then force-pushes the branch to update the remote.

> **Note:** After Phase 0 rewrites history, the user will need to `git push --force-with-lease`
> to update the remote branch. The skill should remind the user of this after Phase 5.

---

## Guidelines

- **One concern per commit.** If a commit message needs "and", consider splitting.
- **Every commit should compile.** Don't commit types that reference code from a
  later commit. If there's a circular dependency, group the tightly coupled
  pieces into one commit and note why in the message body.
- **Use Conventional Commits format.** Every commit must use `type(scope): description`.
  The subject should tell the story of what this commit contributes to the feature
  and why it exists as its own step. Include specific filenames, class names, or
  technical terms where they add clarity (e.g., `feat(prisma): add ExperienceAvailability table`
  not `chore: update database`).
- **Subject under 72 chars, body when needed.** Add a body separated by a blank
  line if the reviewer needs context on a design decision or needs to understand
  how this commit connects to the ones around it.
- **When in doubt, go smaller.** It's easier to squash two commits than split one.
- **Interactive staging is your friend.** When a single file spans layers,
  `git add -p` lets you commit only the relevant hunks.

## Best Practices Summary

1. **Focus on why, not what** - Explain business context and reasoning
2. **Be concise for obvious changes** - Self-evident changes need minimal explanation
3. **Use conventional commits** - Follow the type(scope): description format
4. **Keep lines short** - Subject ≤72 chars, body wrapped at 72 chars
5. **Use imperative mood** - "add feature" not "added feature"
6. **Add bullet points** - For multiple changes or reasons
7. **Reference tickets** - Only when confident about the reference
8. **Credit the LLM** - Always include `Co-Authored-By: Claude <noreply@anthropic.com>`
9. **Separate concerns** - One logical change per commit when possible
10. **Think about future readers** - Write for someone investigating history
11. **PR title = squash-merge message** - Write the PR title as the final conventional commit that will survive squash-merge; focus on business outcome, not technical details

## Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)
- [Git Commit Best Practices](https://cbea.ms/git-commit/)
- [Semantic Versioning](https://semver.org/)
