# AGENTS.md — read before working

Front door for any agent working on **mandelbrotset-xyz** (the Deck.gl tiled Mandelbrot explorer at
mandelbrotset.xyz). `README.md` covers what the project is, how to install, run, and deploy it, and
the current Todos — read it first, then this.

## Rules that bite
- **Build order:** `wasm-lib/pkg` must be `wasm-pack`-built *before* `npm install`. Skipping this is
  the usual cause of a confusing dependency failure.
- Keep the tree coherent and never leave the deploy broken — the site is public.
- Check `README.md` Todos before starting; prefer picking up something already listed over inventing
  parallel work.

## Coordination — you are not the only agent
Patch is the coordination layer: a persistent agent on Pat's box holding shared memory across every
agent and surface, and a record of what each is working on. If Pat has given you a Patch MCP
connection, use it — the connection itself carries the current protocol and tool names.

1. **Before you start.** Ask Patch for a context brief on your objective. It answers with what's in
   flight that touches your work, the exact files and docs to read, and the gotchas not yet written
   down. Ask follow-up questions until your context is the right shape to one-shot the objective —
   that is what it is for, and it is cheaper than guessing wrong.
2. **Announce before you touch shared resources**, and check what others have announced. Highest
   risk here: the deploy target, and `wasm-lib` (a rebuild affects every concurrent working copy).
3. **Priority ladder** when two agents want the same resource: Pat's live request > deploy and
   reliability fixes > in-flight background tasks > deferred work. Yield to anything above you;
   announce and proceed past anything below.
4. **Write what you learned back.** Durable cross-project facts belong in Patch's brain; project
   decisions belong in this repo. Neither is optional.
5. **No Patch connection?** The repo remains ground truth and you can work from it alone. Ask Pat
   for one if you need the shared view — he authenticates each agent individually. **Never put
   credentials in this repo.**
