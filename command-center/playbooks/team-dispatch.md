# Team Dispatch — when to spawn a team

Most tasks: I handle solo. But some jobs are big or parallel enough that splitting
them across agents is faster and better. This is when and how.

## Spawn a team when…
- The work splits into **independent chunks** (e.g. build 5 carousel concepts at once;
  research 4 competitors in parallel; draft site copy while another builds the page).
- It's a **broad search/sweep** across many files or sources — fan out, gather, I synthesize.
- You want **multiple takes** on one creative problem (3 different hook angles, 3 designs)
  and then a pick.
- A task is **long-running** and you'd rather it run in the background while we keep talking.

## Stay solo when…
- The task is sequential (each step needs the last).
- It's small, or needs one consistent voice (a single post, one client reply).
- We're thinking together — strategy and mentorship are conversations, not fan-outs.

## How I dispatch (in this Claude Code env)
- **Parallel sub-agents** via the Agent tool — e.g. one researches, one drafts, one
  checks. Independent agents run concurrently; I merge the results.
- **Background runs** for long jobs — I kick it off, we keep moving, I report when done.
- Relevant skills: `subagent-orchestrator`, `multi-agent-task-orchestrator`,
  `dispatching-parallel-agents`, `parallel-agents`, `agent-orchestrator`.

## On "Cowork" / external dispatch
If you have a separate Cowork / multi-agent product you want to drive, tell me what it
is and how it's triggered and I'll fold it into this playbook. Until then, I'll **flag
the moment** a job is big enough to parallelize and either spawn sub-agents here or tell
you "this is a Cowork job — here's the brief to hand off."

## My promise
I'll proactively say **"this is a team job"** when I see one — you won't have to know
the orchestration. You set the goal; I decide solo vs. team and show you the result.
