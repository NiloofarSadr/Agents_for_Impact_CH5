# Your agent goes here

This folder is empty on purpose.

We built the on-ramp: every federally recognized care site in your county with coordinates, the
census tracts around them with disease burden, insurance, vehicle access and mobility, the federal
shortage designations with the withdrawal trap already filtered out, the air at the only scale it
works, the current respiratory signal with its real resolution stated, both distances computed for
every tract, the licenses checked, and a validation suite that tells you plainly whether any of it
is wrong. We did not build the vehicle. The design decisions in your agent are what you are judged
on.

## What has to be true of what you build here

- **An ADK agent**, in Python.
- **Genuine multi-agent orchestration.** This is your required differentiator. More than one agent,
  passing state, with at least two whose instructions actually conflict. [What that means
  concretely](#what-multi-agent-actually-has-to-mean-here) is below, and the four questions judges
  look for are at the bottom of this file.
- **At least one tool you built yourself.** A Python function tool, or one you defined in MCP
  Toolbox—either counts. The obvious candidate wraps a tract query. The more valuable one holds the
  logic that is not a single query: deciding what "needs the van" means, weighing a modeled
  prevalence against a measured distance, turning a ranked list into a plan with a recommendation
  and a reason attached. Consuming only prebuilt generic tools and calling that your design does not
  count.
- **At least one Google-managed MCP server, consumed.** Do not author your own—use BigQuery's
  built-in server or the [MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox).
- **Deployed to Google Cloud**—Agent Runtime or Cloud Run, your choice.

## What multi-agent actually has to mean here

One agent with several tools is enough when the job is: read the request, pick a tool, answer.
Several agents earn their keep when one of these is structurally true. On this challenge three of
them are, and the second is the strong one.

**1. Two of your jobs need contradictory instructions.** A clinical-safety reviewer whose whole
prompt is *hedge, cite, refuse if unsure* cannot share a system prompt with an outreach writer whose
prompt is *warm, plain language, sixth-grade reading level, Spanish and English*. Put both in one
agent and you get hedged flyers and chatty clinical notes. **This is the two-minute experiment worth
running before you commit to an architecture.**

**2. The equity audit is structurally a second agent.** You are forbidden from using race as a model
input and required to audit your output against it. That means your system must contain a component
that sees data the planner was denied. It also must not share the planner's context, because an
agent asked to produce a plan and critique it in the same breath will defend the plan. **The rule
you were given forces the architecture.** Say that out loud in your demo—it is the best sentence
available to you on this challenge.

**3. Your evidence gathering is embarrassingly parallel.** Burden, access and exposure are three
independent lookups over three tables. Run them concurrently and your wall clock is one hop instead
of three.

**What does not count:** three system prompts behind an `if intent ==`. No shared state, no
disagreement, no component that can overrule another. That is one agent with a switch statement, and
probe 2 below finds it in a single question.

## The API, verified in a lab project on 2026-08-10

Verified against `google-adk==2.7.0` on 2026-08-10. PyPI's current release is 2.11.0, and on
2026-10-12 every class named in this section still imported cleanly from it—imports, not behavior,
so run `pip show google-adk` and try the import below before you build on it. Pin the version you
verified—`pip install google-adk==2.7.0`—before you paste anything in this section; the `Workflow`
graph API is new and the class names here are specific to it.

**`SequentialAgent`, `ParallelAgent` and `LoopAgent` all still work, and all three are deprecated**
in favor of the graph `Workflow`:

```
DeprecationWarning: SequentialAgent is deprecated in favor of Workflow and will be
removed in a future version. Workflow cannot yet be used as an LlmAgent sub-agent.
```

Read that second sentence before you refactor. **Using the deprecated classes is a perfectly fine
choice today**—they work, and `Workflow` cannot yet be a sub-agent of an `LlmAgent`, which is a real
constraint on how you compose things.

The shape that works, and that we ran end to end in a project exactly like yours:

```python
from pydantic import BaseModel
from google.adk import Workflow, Event
from google.adk.workflow import node, START
from google.adk.agents import Context, LlmAgent

class PlanRequest(BaseModel):
    county: str

@node
async def gather_burden(ctx: Context):
    ...                                     # a plain function. No model call.
    return Event(message="burden gathered")

plan_graph = Workflow(
    name="clinic_plan",
    description="Plans mobile clinic stops for a county.",   # REQUIRED to use as a tool
    input_schema=PlanRequest,                                # ALSO REQUIRED
    timeout=120.0,                                           # SEE BELOW. NOT OPTIONAL.
    edges=[(START, gather_burden)],   # add your remaining edges here
)

root_agent = LlmAgent(name="coordinator", model="gemini-3.6-flash", tools=[plan_graph])
```

### Five things that will cost you time if you meet them by accident

**A graph cycle with no `timeout` runs forever.** `Workflow` has no iteration-cap field of any kind,
and `timeout` defaults to `None`. We built a deliberately infinite plan-audit loop and it ran until
an external backstop killed it. With `timeout=5.0` it raised `NodeTimeoutError` cleanly. **If your
graph contains a cycle, set `timeout`.** `LoopAgent` at least has `max_iterations`; a graph does
not. Plan-then-audit-then-revise is a cycle, and it is the architecture this challenge pushes you
toward, so this one is coming for you specifically.

**Both `description` and `input_schema` are required** to use a `Workflow` as a tool, in that order
of complaint. Without a description: *"must have a description to be wrapped as a tool."* With one
but no schema: *"NodeTool requires an explicit Pydantic input_schema."*

**A schema'd workflow takes a JSON string, not a dict.** `run_debug('{"county": "Fulton"}')` works.
A dict or a model instance gets iterated into its keys and fails validation, because the runner is
typed for `str | list[str]`.

**Parallel branches share one state dict and will clobber each other.** The isolation is on
conversation history, not on state. Two branches both writing `output_key="shared"` leave one value
and no error. **Every parallel branch needs a distinct `output_key`.** This is the single most
likely way to lose an hour today, because it fails silently and the symptom is "the agent ignored
one of my lookups."

**A missing `{key}` in an instruction is a hard crash**, not a silent blank:
`KeyError: 'Context variable not found'`. Use `{key?}` if you want it optional. This is good news—it
means a typo surfaces immediately—but it also means you must run every agent once after wiring it.

### How to see it working, which is most of debugging

```python
from google.adk.runners import InMemoryRunner   # confirm the path against your pinned version
from google.adk.plugins import LoggingPlugin
runner = InMemoryRunner(agent=root_agent, plugins=[LoggingPlugin()])
await runner.run_debug("Plan next month's clinic stops.", verbose=True)
```

One line, and you get every agent transition, every model request, every tool call, and **token
usage per call**—which is how you find out whether your six-agent loop is affordable before you run
it fifty times.

In `adk web`, the **State** tab plus the event graph lets you click an event and see which node
produced it. On a multi-agent challenge that is not a convenience, it is the only view of the thing
you are being judged on. When the deck says how you debugged it, "we watched the event graph" is a
better answer than "we read the final output."

Two environment notes. In a notebook use a bare `await`, because `asyncio.run()` raises inside a
cell. And `adk web` defaults to port 8000 on 127.0.0.1, so in Cloud Shell run
`adk web --host 0.0.0.0 --port 8080` and use Web Preview.

### One constraint that has evaporated

On Gemini 2.5 and older, a built-in tool could not share an agent with a function tool of your own,
which forced a sub-agent wrapper. **On Gemini 3.x that restriction is gone.**

Do not cite it as your reason for going multi-agent. It is the most commonly repeated
already-fixed limitation in ADK, several judges know it, and using it as your architecture
justification signals that you inherited a pattern rather than chose one.

## The thing worth remembering while you build

**Your tables are at four different resolutions and not one of them says so.**

A census tract. A 12 km modeling grid wearing an eleven-digit tract ID. A facility point. A
multi-county Health Service Area written onto a county key. Every one of them is dressed up with an
identifier that suggests more precision than it has, no query fails, and every ranking you build
looks perfectly reasonable.

An agent that says *"respiratory illness is rising in this neighborhood"* from a four-county number
has produced something specific, plausible and false about people's health. An agent that says
*"I can tell you what respiratory visits are doing across the four-county area that includes this
one; I cannot tell you anything about this neighborhood, and neither can anything else available
publicly"* is more useful, more honest, and will score better.

That is the same shape as the trap in section 2 of the notebook, and it is the shape of the whole
challenge.

## The four questions judges look for

They are printed in the README too, so you have had them all day. Answer them in the deck or the
pitch video; nobody will ask them at a keyboard.

1. **Delete any one agent. Does the answer get worse?** If not, that agent was decoration. The
   strongest version of this answer is a before and after you can show.
2. **Show me a key in `session.state` written by one agent and read by another.** If there isn't
   one, you have a single agent and some function calls, however the diagram is drawn.
3. **Show me two agents whose instructions genuinely conflict.** Near-identical prompts are one
   agent wearing hats.
4. **Show me the point where your system rejected its own first answer.** This is the one that
   separates a good team from a winning one.

See the README for the nine data defects and the county-by-county warnings, and section 13 of the
notebook for the same API notes in context.
