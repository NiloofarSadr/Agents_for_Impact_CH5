# Challenge 5—Dynamic Public Health Equity & Preventative Mobile Care Broker

**Agents for Impact 2026**

---

## Why this one matters

A mobile clinic is a van with a nurse practitioner, a blood-pressure cuff, a glucometer and a
folding table. It parks somewhere on a Saturday, it sees forty people, and it drives away.

Whoever decides where it parks has made a public health decision worth more than most of what
happens inside it. Park it in the wrong neighborhood and you have run a very expensive health fair
for people who already have a doctor.

The person making that decision has a county of maybe three hundred neighborhoods, one van, and
four Saturdays a month. She does not have an epidemiologist. She has a spreadsheet somebody sent her
and a strong feeling about two ZIP codes.

Here is the part that makes this a data problem rather than a shrug: **the neighborhoods that need
the van most are findable, from public federal data, months in advance.** Not the people—the rule at
this event forbids that, and rightly. The *places*. Census tract by census tract, with a number
attached to each one.

**Your job today is to build the thing that decides where the van goes—and can explain the choice
to the people who live there.** Not who to treat. Not what to prescribe. Where to park, and why that
street and not the next one over.

And you are going to spend your first ten minutes on the obvious answer and watch it fall
apart. We will not spoil it here—[it is section 2 of the notebook](#the-hook-you-will-hit-in-the-first-ten-minutes),
and it is worth arriving at honestly.

---

## How to read this

**This is a reference for your whole afternoon, not something to read end to end now.** Here is
what each of you needs in the first fifteen minutes.

| If you are… | Read now | Come back for |
|---|---|---|
| **Everyone, together** | [The five things](#the-five-things-youre-working-with) · [Three tracks](#three-tracks-one-architecture) · [What you're building](#what-youre-building) · [Pick your county](#now-pick-your-county) | — decide these before anyone opens a keyboard |
| **Team lead** | [Step 0](#step-0organize-your-team) · [How you'll be judged](#how-youll-be-judged) | [What will set yours apart](#what-will-set-yours-apart)—read it *before* you write code, not before you demo |
| **Data lane** | [Step 4, load the data](#step-4load-the-data) · [What you'll have](#what-youll-have) | [The data, and why we chose it](#the-data-and-why-we-chose-it) · Section 12 of the notebook |
| **Agent lane** | [The technology](#the-technology-youll-use)—**all of it, now.** Your differentiator is an architecture and you cannot bolt it on at the end | [`agent/README.md`](agent/README.md) · Section 13 of the notebook · [Reference](#reference) |
| **Front end lane** | [Front end lane](#front-end-lane2-people) | [Your output artifact](#your-output-artifact-the-clinic-plan) |
| **Story lane** | [What the data actually says](#what-the-data-actually-says) | [Your output artifact](#your-output-artifact-the-clinic-plan) · [The data](#the-data-and-why-we-chose-it)—which numbers are measured and which are modeled, because judges check |

**Three things everybody should know by the end of hour one**, whatever lane you are in:

1. **Your differentiator is an architecture, not a query, so it is the one thing you cannot add
   later.** The other four challenges hand teams a technology that runs over prepared data. Yours is
   a shape you have to design. Decide it in the first ten minutes, not after lunch.
2. **Your tables are at four different resolutions and none of them says so.** A census tract, a
   12 km modeling grid wearing a tract ID, a facility point, and a multi-county Health Service
   Area written onto a county key. An agent that blends all four into one confident sentence has said
   something the data cannot support, and that is the most common way to lose points here.
3. **Race is banned as a model input and required as an audit of your output.** Not a footnote—it is
   the single strongest argument for the architecture you are about to build, and
   [there is a section on exactly why](#race-is-not-a-model-input-here-it-is-an-audit-of-your-output).

---

## The five things you're working with

Small vocabulary, used consistently everywhere from here on. Worth thirty seconds now.

| Term | What it means |
|---|---|
| **Census tract** | A Census Bureau area of roughly 4,000 people. Small enough to park a van in, large enough that nobody in it is identifiable. Our unit for everything about **people** |
| **Safety-net site** | A clinic that will see somebody with no insurance on a sliding scale—an FQHC or a HRSA health center site. **Not the same as "a clinic."** A hospital is a bill |
| **Shortage *area* vs shortage *facility*** | An **area** says a neighborhood is underserved—a siting signal. A **facility** says a clinic serves an underserved population—a marker of where care already *is*. Two federal layers, opposite meanings, [and confusing them is the easiest serious mistake here](#nine-defects-you-will-meet-and-why-we-show-them-to-you) |
| **Health Service Area** | A group of counties that share patterns of care-seeking. The current-disease numbers are computed for one of these and then written onto **every county in it.** Fulton's covers four counties, Travis's six, Houston's eight |
| **Resolution** | How fine a claim the data can actually support—which is **not** the same as how many digits it has. This is the whole challenge |

The whole challenge is: **one county, one van, four Saturdays, and a reason you can say out loud.**

---

## Three tracks, one architecture

Three people could ask for this system and mean three different things. Pick the one whose story you
want to tell on stage.

**These are suggestions, not a menu you are confined to.** Pick one, combine two, or invent your
own—if you can see a public-health-equity problem in the same vein that these three miss, that is
exactly the kind of judgment this challenge rewards. Just be ready to say why yours is worth solving.

| Track | The situation | Who your user is | What makes it hard |
|---|---|---|---|
| 🚐 **Siting** | Next month's calendar is empty and four Saturdays need filling | An outreach lead at the county health department | Every ranking you can build is defensible. Choosing *between* them, out loud, is the job |
| 📋 **Accountability** | A funder wants to know the money went where the need was, not where the parking was easy | A program director writing a grant report | Your best evidence is a demographic audit of a plan you were forbidden to build on demographics |
| 📣 **Explanation** | The van is coming to one neighborhood and not the one next door, and somebody has to say why | A community health worker who lives there | Everything above is written for a professional. This has to be readable, in more than one language, by somebody who is not |

### The tracks are the architecture, and that is not a coincidence

Read those three rows again as three *agents* rather than three products.

The siting agent **plans**. The accountability agent **audits the plan**—and it has to see data the
planner was forbidden to use, so it cannot share the planner's context. The explanation agent
**communicates**, and its instructions directly contradict the other two: hedge, cite and qualify is
correct for a clinical recommendation and wrong for a flyer that has to be understood by somebody
standing at a bus stop.

**One agent cannot hold all three prompts.** Try it—it takes two minutes and it is more convincing
than this paragraph. You get hedged flyers and chatty clinical notes.

Whichever track you demo, the honest version of it needs the other two behind it. That is your
differentiator, and it fell out of the problem rather than being bolted onto it.

---

## What you're building

**Not a lookup with a chat box. A capability.**

An agent an outreach lead can hand a question to on a Thursday and get an answer from that she can
put on next month's calendar on the Friday—assembled from data she does not have time to pull
together herself, and honest about which of its answers are solid and which are modeled.

Picture a single afternoon:

> **Thursday, 4pm.** She runs outreach for the county health department. There is one van, it is
> booked for four Saturdays next month, and the calendar is empty. Last month it went where a
> councilman asked for it. She has a hunch about two neighborhoods, a spreadsheet from the state,
> and no way to tell whether the hunch is right. She is not responding to an outbreak. She has three
> weeks—which is exactly the point, because **preventive care is the one part of health that can be
> planned in advance**, and the alternative to planning it is meeting these people in an emergency
> department in five years.

Here is what she asks between now and the end of the month, and what answers each:

| What she asks | What answers it |
|---|---|
| *"Which neighborhoods have the most people who are sick and not being seen?"* | `burden_tracts`—uninsured share, asthma, COPD, diabetes, high blood pressure, and `pct_checkup`, which counts adults who **did** have a routine visit in the past year. **Low is bad on that one and high is bad on the others**—read the direction before you rank |
| *"How far is each neighborhood from a clinic that will actually take them?"* | `tract_access`—**two** distances per tract, to any care site and to a safety-net one, and the difference between them |
| *"Who can't get to a clinic even if there is one?"* | `burden_tracts`—no-vehicle households, mobility difficulty, over-65 share. **A car makes five kilometers nothing** |
| *"Has the federal government already said this area is underserved?"* | `shortage_areas`, with `HPSA_SCORE`—**and for some counties the honest answer is that it has not** |
| *"Is respiratory illness rising right now?"* | `disease_weekly`—**and it is a multi-county regional number on a county key, so it cannot answer this about a neighborhood** |
| *"Is the air bad here?"* | `exposure_tracts`—but read [section 2 of the notebook](#the-hook-you-will-hit-in-the-first-ten-minutes) before you use it the way you are about to |
| *"How do I tell the neighborhood we didn't pick why we didn't pick them?"* | Your agent's judgment. This is the deliverable |

Notice these need **different things**. Three of those questions are answered at tract level, one
by federal shortage polygons, one at a multi-county region and one on a 12 km grid—and working out
which is which *is* the design problem. Note that not one of them is answered by the facility
points in `care_sites`, even though a map of dots is the first thing everybody builds.

**That range is the challenge.** An agent that answers only the first question is a dashboard with a
chat box. An agent that handles all seven is something a county health department would keep open
all year.

### Questions that need more than we gave you

Be aware of the edges—and treat them as opportunity, because closing one is exactly what separates a
team. Say these out loud in your demo too: naming a limitation you cannot fix reads as competence,
and having a judge find it reads as the opposite.

| The question | What you'd need to add |
|---|---|
| *"How long does it take to get there on the bus?"* | **No license-clean federal dataset of travel time to health care exists.** The best transit-accessibility dataset in the country is CC BY-NC and therefore unusable here. We give you straight-line distance and `HPSA_SCORE`, which folds in a federally computed travel-time term |
| *"Where are the free clinics and the county clinics?"* | **No national list exists.** Our facility layers are federal only—CMS-certified and HRSA-funded. Every distance we give you is therefore an *upper bound*: the real nearest option may be closer and we cannot see it |
| *"Where are the pharmacies?"* | No federal file provides them without individual-level personal data. The CMS pharmacy file has NPIs and no addresses; NPPES ships practitioners' names and often their home addresses. **Naming this exclusion is a stronger answer than quietly using NPPES** |
| *"Where do other mobile clinics already go?"* | The one national registry has no license, no bulk download, and asserts intellectual property over its contents. Do not scrape it |
| *"How many people in this tract have asthma?"* | Nothing. CDC PLACES gives **modeled prevalence**, not counts—a prediction about people like the people who live there. Use it and say it is modeled |
| *"Is COVID rising in this neighborhood?"* | Nothing at that grain, and this is the trap. The file has a real county FIPS and looks county-level. **It is a Health Service Area figure written onto every county in the area** |
| *"Which specific people are unmanaged diabetics?"* | Nothing, and there should be nothing. Individual-level data is prohibited at this event. This is a line, not an obstacle |

---

## Now pick your county

A county health department is a real organization with a real mobile clinic, and the county is the
level at which somebody actually decides where the van goes on Tuesday. Change one cell at the top
of the notebook and everything follows.

**You do not have to pick the county you are sitting in.** Pick the one that makes your story.

Every number below was measured, not estimated—it comes from the run that produced the snapshots in
Cloud Storage, so you are choosing with your eyes open. **Read the last four columns.** The first
few tell you how big the county is; the last four tell you whether the challenge works there.

| County | Tracts | Population | Uninsured 18-64 p10→p90 | Tracts with a safety-net gap | Worst km to a safety-net clinic | Shortage **areas** desig/all | Shortage **facilities** | Transport measure (`pct_lack_transport`) | Disease trend |
|---|---:|---:|---|---:|---:|---:|---:|:-:|:-:|
| **Fulton GA** (Atlanta) | 326 | 1,066,710 | 5.9% → 18.2% | **135 (41%)** | **28.6** | **0 / 99** | 6 | ✅ | ✅ |
| **Santa Clara CA** (Sunnyvale) | 408 | 1,936,259 | 3.0% → 14.6% | 116 (28%) | 15.9 | **0 / 0** | 13 | ✅ | ❌ |
| **Cook IL** (Chicago) | 1,328 | 5,275,505 | 5.1% → 24.3% | 308 (23%) | 20.7 | **498 / 934** | 32 | ✅ | ✅ |
| **Harris TX** (Houston) | 1,110 | 4,731,109 | **8.9% → 40.8%** | 314 (28%) | 22.8 | **0 / 0** | 15 | ❌ | ✅ |
| **Travis TX** (Austin) | 289 | 1,290,185 | 6.4% → 28.2% | 90 (31%) | 21.7 | **0 / 0** | 2 | ❌ | ✅ |
| **Bronx NY** | 347 | 1,472,508 | 7.5% → 23.0% | 20 (6%) | **4.8** | 338 / 338 | 8 | ✅ | ❌ |

Any county in the United States works, including ones not listed—you just have not seen their
numbers, and neither have we. Run the notebook and read its section 3 before you build a narrative
on one.

### Some of these counties will fight you, and here is which

This is the most useful paragraph on the page. **Five of the six are missing something** a
plausible demo would lean on—Cook is the only one that has everything—and you would rather know
now than at minute 200.

**Fulton is the default**, because it has the widest gap between the two distances this challenge is
actually about. **135 of its 326 tracts—more than two in five—are further from a clinic that will
see somebody uninsured than from the nearest clinic of any kind.** For one tract in ten that gap is
15 km or more. The other four counties in the set sit between 23% and 31%, and none has a
one-in-ten gap above 2.5 km. Atlanta is where "care" and "care you can actually use" are most obviously
different things.

**But Fulton ships an empty `shortage_areas` table**, and that is the trade. All 99 of its
designations are `Proposed For Withdrawal`, so the county has zero live ones. You lose `HPSA_SCORE`
as a neighborhood-level signal, which is our only travel-burden measure. If your idea leans on
shortage areas, switch to **Cook** and you get 498 of them.

**Santa Clara and the Bronx have no current disease data at all.** Not sparse, not lagging:
`disease_weekly` arrives with 201 weeks of rows and every respiratory column NULL in every one of
them, because CDC reports `Data Unavailable` for those two Health Service Areas throughout. Two of
the largest, densest, best-instrumented counties in the country, both dark. The table loads, the row
count looks healthy, and the data is not there. **This is the only layer in the pack that moves week
to week**, so if your demo is "the van follows the respiratory surge", it does not work in
Sunnyvale or New York.

**Harris and Travis have no transportation measure.** CDC PLACES publishes `LACKTRPT`—lack of
reliable transportation—for 40 states and not the other 11, and Texas is one of the 11, so the
`pct_lack_transport` column in `burden_tracts` is NULL in every row for both counties. Neither
county is blind to transport: `pct_no_vehicle` from CDC SVI survives, and it measures vehicle
*ownership*, which is not the same as being able to get a ride. Know which one you are quoting.

**The Bronx barely has the phenomenon this challenge is built on.** Its median tract is 390 meters
from care, no tract in the borough is more than 5 km from a safety-net site, and the largest
safety-net gap anywhere in it is 650 meters. That makes it the *sharpest* test of whether your agent
understands what it is looking at—an agent that recommends a mobile clinic in the Bronx on distance
grounds has not read its own numbers—and the weakest case for actually sending one.

**Harris has the strongest raw inequality**—forty percent uninsured at the ninetieth percentile—and
**Travis is the smallest and fastest to iterate on**, which makes it a good development county and a
thin demo.

> **Why a county, and not a city or a state?** Because a county health department is a real
> organization with a real van and a real budget, and the county is the level at which somebody
> decides where it goes on Tuesday. It is also the finest level at which the current disease data
> resolves at all—and it does not really resolve there either, which is a lesson rather than a
> limitation.

Before you write any code, fill this in:

> Our agent helps **\_\_\_\_\_\_\_\_\_\_** in **\_\_\_\_\_\_\_\_\_\_ County** decide
> **\_\_\_\_\_\_\_\_\_\_**, and the thing it knows that a spreadsheet does not is
> **\_\_\_\_\_\_\_\_\_\_**.

Write it down before you write code. Every design argument you have this afternoon resolves faster
against a specific situation than a general one, and it is the sentence your demo opens with.

---

## The technology you'll use

| | |
|---|---|
| **Agent framework** | Google Agent Development Kit (ADK), Python |
| **Model** | Gemini 3.x. `gemini-3.6-flash` is verified working |
| **Data** | BigQuery, in your own project |
| **At least one Google-managed MCP server, consumed** | BigQuery's built-in server, or MCP Toolbox for Databases. Do not author your own |
| **At least one tool you built yourself** | A Python function tool or one defined in MCP Toolbox |
| **Deployment** | Agent Runtime or Cloud Run, your choice |

**Also already set up for you, and worth ten seconds now rather than later: Antigravity.** Your
Google Skills lab environment has a button that launches the **Antigravity IDE**, and the
**Antigravity CLI** is one word away in Cloud Shell—type `agy`. Not required, and nothing here
depends on either, but we strongly recommend you use one: every lane has tedious work a coding
agent will happily absorb. [Details in Step 3](#strongly-recommended-antigravity-the-ide-and-the-cli).

### Choosing your MCP server

- **BigQuery's built-in MCP server** if your agent mostly needs to run queries you have already
  written. Fastest path.
- **[MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox)** if you want named,
  parameterized tools with the SQL fixed in a config file rather than generated by the model. On
  this challenge that is usually the better answer, because the queries carry judgment calls you do
  not want a model reinventing per turn.

> Whichever you pick, **you still need at least one tool you wrote.** Consuming only prebuilt generic
> tools and calling that your design does not count.

### And one required differentiator: **ADK multi-agent orchestration**

Each of the five challenges has one required technology. Yours is multi-agent orchestration, and
here is why it belongs in this problem rather than being bolted on.

**Yours is the only differentiator in the pack that is not a data technology.** The other four
challenges hand teams something that runs over prepared data—a model, an index, a graph, a grounding
call. There is nothing we can pre-build for you here, because the thing you are being judged on is a
*shape*. That has one enormous practical consequence: **you cannot add it at the end.** Every other
challenge can. Decide your architecture in the first ten minutes.

#### What makes a problem genuinely need more than one agent

One agent with several tools is enough when the job is: read the request, pick a tool, answer. That
describes most agent demos and it is not a criticism. Several agents earn their keep when one of
these is structurally true—and on this challenge, three of them are.

**1. Two of your jobs need contradictory instructions.** A clinical-safety reviewer whose whole
prompt is *hedge, cite, refuse if unsure* cannot share a system prompt with an outreach writer whose
prompt is *warm, plain language, sixth-grade reading level, Spanish and English*. Put both in one
agent and you get hedged flyers and chatty clinical notes. This is the two-minute experiment worth
running before you commit to anything.

**2. The equity audit is structurally a second agent, and this is the strong one.** You are
forbidden from using race as a model input and required to audit your output against it. That means
your system must contain a component that sees data the planner was denied. It also must not share
the planner's context, because an agent asked to produce a plan and critique it in the same breath
will defend the plan. **The rule you were given forces the architecture.** Say that out loud in your
demo—it is the best sentence available to you.

**3. Your evidence gathering is embarrassingly parallel.** Burden, access and exposure are three
independent lookups over three tables. Run them concurrently and your wall clock is one hop instead
of three.

**Your agents must genuinely coordinate.** Three prompts in one file with a `if intent ==` in front
of them is not an architecture, and it is the most common way to miss the point while appearing to
hit it. The test is the one a judge will apply: **show me a key in `session.state` written by one
agent and read by another.**

**But the orchestration is not the answer, and this is what most teams will miss.** A multi-agent
system makes a *disagreement* visible—between what the plan recommends and what the audit finds,
between what the data supports and what the recommendation claims. Deciding what that disagreement
means, and whose answer wins, is where your agent earns its score. A room full of agents that all
agree is one agent with extra latency.

#### The constraint that has evaporated, and you should know why

On older models a built-in tool could not share an agent with a function tool of your own, which
forced a sub-agent wrapper. **On Gemini 3.x that restriction is gone.** Do not cite it as your reason
for going multi-agent; a judge who knows will not be impressed, and several of them will.

The API details that will actually cost you time—the graph `Workflow` that has replaced
`SequentialAgent`, the cycle with no `timeout` that runs forever, the parallel branches that clobber
each other's state, and the JSON-string-not-dict runner signature—are in
[`agent/README.md`](agent/README.md) and in section 13 of the notebook, both verified in this environment on
2026-08-10. **Read one of them before you write a line.**

#### The four questions judges look for

Answer them in your deck or your video; nobody will ask them in person. These are the actual questions, and they are all the same question.

1. *Delete any one agent. Does the answer get worse?* If not, that agent was decoration.
2. *Show me a key in `session.state` written by one agent and read by another.* If there isn't one,
   you have a single agent and some function calls.
3. *Show me two agents whose instructions genuinely conflict.* Near-identical prompts are one agent
   wearing hats.
4. *Show me the point where your system rejected its own first answer.*

---

## Getting started

You have **4.5 hours** and there are **8–10 of you**. That is too many people for one keyboard,
and the biggest risk to your team is the first hour disappearing into setup. Spend twenty minutes
on Step 0. It pays for itself twice over.

### Step 0—Organize your team

**Pick a team lead.** One person who makes the call when you are behind—and you *will* be behind.

**Pick a repo owner.** Can be the same person. They create the team's repository and add everyone.
Everything lands in one repo, not eight forks.

**Everyone else: create a free [GitHub](https://github.com) account now** if you don't have one,
and **send your username to the repo owner** while they're setting up.

**Agree your county, your track, and your scenario** (see above). Five minutes. Write it where
everyone can see it.

**Then spend ten more on [What will set yours apart](#what-will-set-yours-apart).** It sits near the
bottom because it only makes sense once you know what you are building—but it is the section that
decides whether your demo looks like everyone else's, so read it before you write code rather than
after.

**Split into four lanes.** All four start immediately, in parallel.

#### Data lane—2 to 3 people

Running the notebook takes two to three minutes, so that is emphatically *not* the job. This lane
owns everything between raw tables and a query the agent can call:

- **Get the distance query working and hand it to the agent lane early.** The notebook writes
  `tract_access` for you, so start from there rather than rebuilding it. They are blocked until the
  queries their tools will wrap exist. This is the equivalent of training a model in other
  challenges: an *input* to the agent, not a step 4.
- **Decide what "needs the van" means** and encode it. Top decile on uninsured? Worst on three
  measures at once? Distance-weighted by no-vehicle share? This is a modeling decision, it is
  yours, and judges look for it.
- **Keep track of which resolution each number came from**, all the way through. If it collapses
  anywhere in your pipeline it will collapse in your agent's answers too.
- **Read the WARN rows** the validation section prints. They are real defects in federal data and at
  least one of them is worth a slide.
- **The equity audit** ([explained below](#what-auditing-the-outcome-actually-means)). This one is
  not optional on this challenge—it is a requirement and it is also your architecture argument.
- **Decide whether to bring extra data**, and if so, source it and check the license.

#### Agent lane—2 to 3 people

**Start at minute zero, not after lunch.** Unlike the other four challenges you cannot bolt your
differentiator on at the end.

- **Decide the architecture first.** How many agents, what each one is forbidden from seeing, and
  which state keys pass between them. Draw it on the whiteboard before anybody opens an editor.
- **Prompt engineering.** Expect this to be the hardest part. Your system instructions have to teach
  each agent who it is talking to, when to reach for which tool, and—importantly—**when to refuse.**
  An agent that confidently says "COVID is rising in this neighborhood" from a four-county number is
  worse than one that says *"I can tell you about the region; I cannot tell you about this street."*
- **At least one tool you built.** Required. The obvious one wraps a tract query. The more valuable
  one holds the logic that is not a single query—turning a ranked list into a plan with a
  recommendation and a reason attached.
- **Give every parallel branch its own `output_key`.** Branches share one state dict and will
  silently clobber each other. This will cost somebody an hour today.
- **Deploy early, not at the end.** The front end is blocked on a live endpoint, and deployment
  always takes longer than you think.
- **Test with the real questions.** Take the seven questions above and ask them.
- **Decide what failure looks like.** What does your agent say when the audit disagrees with the
  plan? When a county has no shortage areas? Those two answers are most of your score.

#### Front end lane—2 people

Three routes. **Pick deliberately and be ready to say why**—the choice tells judges who you think
the user is.

| Option | Strength | Trade-off |
|---|---|---|
| **`adk web`** | Fastest. Built in. Works immediately, and where you should start. Its **State tab and event graph let you click an event and see which agent produced it**, which is most of debugging a multi-agent system | Obviously a developer tool. Fine while building, weak as a product story |
| **Gemini Enterprise** | Polished, almost no front-end code. An agent on Agent Runtime can be surfaced through it | Serves **internal** users, not the public |
| **Custom web UI** | Full control. A county map with the four Saturdays marked on it beats a chat log | The most work by far. Scope it small |

**Everybody starts on `adk web`, and you should too.** The question is whether you *finish* there.
Shipping it as your demo is a choice you will have to defend, and "it was already there" is the
weakest version of that answer.

There is a real argument for staying close to `adk web` on *this* challenge specifically: your
differentiator is invisible in a chat window, and the event graph is the only thing that shows it
running. If you build a custom UI, **find a way to make the architecture visible in it.** A team
whose interface shows the audit agent disagreeing with the planner has turned a technical
requirement into a demo moment.

- **Do not wait for a working agent.** Mock the response, build against it, swap later.
- **Whatever you build, the demo runs on it.** Test it on the machine you will present from.

#### Story lane—1 to 2 people, starting at minute zero

Not "make slides at the end." This lane owns whether anyone understands what you built.

**What you hand in.** Four things, uploaded to the submission portal at
https://portal.angelhack.com/a4i-console before the deadline your facilitator gives you:

1. your GitHub repo link
2. your Google Skills project link (the Qwiklabs environment you built in)
3. your pitch deck
4. a **pitch video**: a screen-share walkthrough, one of you talking the judges through what you
   built while running it

**Judges score those four things after the event. Nobody comes to your table and there is no
Q&A.** Every question in [How you'll be judged](#how-youll-be-judged) has to be answered in the
deck or the video, or it counts as unanswered.

**What you're preparing: a short pitch deck, a quick demo, and the recording of it.** Presentation time at this event is
tight—your facilitator will give you the number, but plan for short. **A crisp pitch with one moment
that lands beats a thorough walkthrough nobody has time to hear.**

- **The pitch deck.** Short. The problem, your scenario, what your agent does, what you found, what
  you'd do next. Front-load it—assume you get cut off before your last slide.
- **The demo.** Pick one or two questions that best show what your agent can do, and **rehearse it.**
  Have a screenshot ready in case the live version misbehaves.
  Once it works, **record it as your pitch video**: a screen-share with one of you narrating. That
  recording, not the live demo, is what the judges watch.
- **The Clinic Plan**—your output artifact (see below). Something an outreach lead would actually
  receive.
- **The strongest thing you can say on stage is a number from your own data that surprised you.**
  Not a slide of architecture boxes. One number, one neighborhood, one sentence.
- **The honest limitations.** Judges explicitly reward this. One line in the deck is enough.
- **Know which of your numbers are measured and which are modeled.** Judges check. The answer
  is in the notebook and it is a good one—make sure the deck or the video gives it.

Time the whole thing out loud at least once. Teams almost always run long.

### Your output artifact: the Clinic Plan

Four parts. Show them in a demo, not a document. **Three of the four are your three agents**—the
plan, the audit and the thing you hand to a person—and the fourth is what an honest system says
about itself. That is the point.

- **Where the van goes, and why.** Four Saturdays, four locations, ranked, with the reason for each.
  Not a heat map—a short list she could put on a calendar, with numbers attached and the tract named.
- **What we could not tell you.** Named, counted, and not hidden. Which claims are tract-level, which
  are a 12 km grid, which are a multi-county region. In this challenge that is not a
  disclaimer—**it is a finding.**
- **Who this plan lands on.** The equity audit, run against the demographics you were forbidden to
  rank on, reported whether or not it is comfortable. **A negative result honestly reported beats a
  clean-looking model nobody checked.**
- **The thing you hand to the neighborhood.** A flyer, a text message, a script for a community
  health worker—plain language, and in more than one language if your county needs it. This is the
  part every team will skip and it is the part the challenge is named for. It is also the cleanest
  possible demonstration that one system prompt could not have written all four of these.

### Step 1—Create the team repository

**Repo owner only.**

1. At the top of this page, click the green **Use this template** button → **Create a new
   repository**. *(No button? Use **Fork** and tell a coach.)*
2. Name it after your team, choose **Public**, click **Create repository**.
3. **Settings → Collaborators** → add every teammate's GitHub username.
4. Paste the repo URL where everyone can see it.

### Step 2—Get into your Google Cloud project

**Your facilitator will tell you how to access your project. Follow those instructions**—they vary
by venue and they're the fastest path.

**There is one project per team.** You all share it, which is the point—you can all see the same
BigQuery tables. It also means you can overwrite each other. Agree on who creates what.

You have Owner. You don't need to create a project, set up billing, or download a key file.

### Step 3—Everyone: get into Cloud Shell

**Cloud Shell is where you'll work.** It has `gcloud`, `bq`, Python, Node, git, Docker, and the
Antigravity CLI already installed. Nothing to set up on your laptop, no admin rights needed.
(The Antigravity IDE launches from a button in your Skills lab environment; see below.)

1. In the Cloud console, click the **`>_`** terminal icon, top right.
2. `git clone <your team repo URL>`, then `cd` into the folder it makes (your repo's name).
3. `cloudshell workspace .` opens the editor on it.

New to any of this?
[Using Cloud Shell](https://docs.cloud.google.com/shell/docs/using-cloud-shell)
·
[Cloud Shell Editor overview](https://docs.cloud.google.com/shell/docs/editor-overview)

**While you are here, enable the APIs in one command.** The console will otherwise prompt you
for them **twice**—once when Colab Enterprise first opens and again from a separate button on its
home page—and that second prompt is the single most common way to lose ten minutes this morning:

```bash
gcloud services enable aiplatform.googleapis.com bigquery.googleapis.com notebooks.googleapis.com dataform.googleapis.com compute.googleapis.com
```

One thing worth knowing: your `$HOME` directory persists between sessions. Anything outside it
does not—so keep your work in the cloned repo.

**One repo, one branch per lane.** You are four lanes working in parallel in a single repository,
and if everyone commits to `main` you will spend part of your afternoon resolving conflicts instead
of building:

```bash
git checkout -b agent      # or data, frontend, story
```

#### Strongly recommended: Antigravity, the IDE and the CLI

Antigravity is Google's agentic coding environment, and **it is already set up for you in two
forms**. Neither is a requirement, and nothing in this challenge depends on either—so don't lose
time fighting one if it isn't helping. But we strongly recommend you use at least one, because every
lane has tedious work it will happily absorb, and the fastest teams at events like this are the ones
that let a coding agent do the typing while they do the thinking.

**The Antigravity IDE.** Your Google Skills lab environment includes a button that launches it. A
full editor with an agent in it: it reads your repo, proposes edits you review before accepting,
runs code in the terminal, and can drive a browser. If you'd normally open an editor, open this one.

**The Antigravity CLI (`agy`).** Already installed in Cloud Shell. You run zero setup commands—just
type it:

```bash
agy
```

`/diff` shows pending changes before you accept them, `/permissions` controls what it can do on its
own. Review before you accept.

[Antigravity: getting started](https://antigravity.google/docs/getting-started)
·
[IDE overview](https://antigravity.google/docs/ide/overview/)
·
[CLI install and auth](https://antigravity.google/docs/cli/install)
·
[CLI hands-on codelab](https://codelabs.developers.google.com/antigravity-cli-hands-on)

### Step 4—Load the data

**Data lane's job.** One person runs it; nobody else waits.

1. In the Google Cloud console, search for **Colab Enterprise** and open it.
2. **You'll be asked to enable some APIs. Say yes.** Then the Colab Enterprise home page shows
   *another* **Enable APIs** button at the top. Click that too. Two prompts is expected—it isn't an
   error and you haven't done anything wrong. (If you ran the `gcloud` command in Step 3, you may
   not see them.)
3. **My Notebooks** → **Import** → source **URL**, and paste this:

   ```
   https://raw.githubusercontent.com/haggman/A4I2026-challenge-5-public-health/main/notebooks/c5_01_load_explore.ipynb
   ```

4. Click **Import**, open the notebook, set `COUNTY_FIPS` at the top (and the matching
   `COUNTY_NAME` and `STATE_ABBR`—the cell checks them), and run the cells top to bottom. It takes
   **two to three minutes** to run and rather longer to read.

**Read the text between the cells.** Several explanations will save you time later, and one of
them—section 2, where the obvious answer fails on purpose—is something judges look for in your deck
and video.

**If the notebook won't run**, or a federal data server starts refusing the room (150 people hitting
one endpoint in ten minutes looks like an attack to some of them), there's a headless fallback. The
snapshot already has everything the notebook pulls. From the repo root in Cloud Shell:

```bash
bash scripts/load.sh 13121
```

```bash
bash scripts/load.sh --list       # every county we've published
```

**Note the argument. It is a five-digit county FIPS, not a state**, which is a deliberate difference
from Challenge 4. Santa Clara is `06085`, and that leading zero is part of the code rather than
decoration—type it as a number and you get `6085`, which matches nothing.

One asymmetry worth knowing. The notebook pulls live from five public publishers and teaches as it
goes; `load.sh` restores the identical tables from a Cloud Storage snapshot and teaches nothing. It
also only covers the counties we published in advance, where the notebook works for any county in
the United States. Use the notebook if you can.

Invoke it with `bash` rather than `./scripts/load.sh`—that way it doesn't matter whether the file
arrived with its executable bit set.

It's safe to run more than once. Every table is fully replaced rather than appended to.

### What you'll have

Eight tables in your project, in a dataset called `a4i_health`. **Three describe people, four
describe care, and one is the join we did for you**:

| Table | Role | What it is |
|---|---|---|
| `burden_tracts` | People | One row per census tract—uninsured, checkup, asthma, COPD, diabetes, blood pressure, disability and mobility, lack of transportation (`pct_lack_transport`, NULL in 11 states), no-vehicle households, over-65 share, and a centroid |
| `exposure_tracts` | People | One row per tract—mean and maximum PM2.5 and the number of days over each of four thresholds. **Read section 2 before you rank on it.** Its tract set is slightly *larger* than `burden_tracts`, because EPA models every tract that exists and PLACES suppresses the ones too small to model—so join LEFT from burden, not INNER |
| `disease_weekly` | People | One row per week—emergency-department visit percentages for COVID, influenza and RSV. **A Health Service Area figure on a county key** |
| `care_sites` | Care | Every federally recognized care site inside your county, with coordinates and a `site_kind` |
| `care_sites_state` | Care | The same, for the whole state, before the county filter. Useful when a clinic just over the county line is the nearest one |
| `shortage_areas` | Care | HRSA designations saying **a neighborhood is underserved**. A siting signal. **Legitimately empty in four of our six counties** |
| `shortage_facilities` | Care | HRSA designations saying **a clinic serves an underserved population**. This marks where care already *is*. **Do not `UNION` it with the one above** |
| `tract_access` | The join | One row per tract—distance to the nearest care site of any kind, distance to the nearest safety-net site, and the difference. **This is the table the challenge turns on** |

---

## The data, and why we chose it

Eight tables, in `<your-project>.a4i_health`, from five publishers—plus
`bigquery-public-data.geo_us_boundaries.counties`, which is how the notebook works out which
facilities are actually inside your county, because none of the federal facility layers publishes
a usable county code.

| Source | Feeds | License |
|---|---|---|
| **CDC PLACES** 2025 release | `burden_tracts` | `PUBLIC_DOMAIN`, machine-readable in the dataset metadata. The cleanest license in the pack |
| **CDC/ATSDR Social Vulnerability Index** 2022 | `burden_tracts` | No restriction stated; the service's `copyrightText` is an attribution credit. Federal work. Cite the required citation string |
| **EPA/CDC Daily Census Tract-Level PM2.5** | `exposure_tracts` | EPA data, republished by CDC. EPA states its data is public domain under 17 U.S.C. § 105. **See the note below** |
| **HRSA** health centers, shortage areas and facilities · **CMS** certified facilities | `care_sites`, `shortage_*` | HRSA states *"Usage limitations: None"*. **See the note below** |
| **CDC National Syndromic Surveillance Program** | `disease_weekly` | `USGOV_WORKS`, *"Public Domain U.S. Government"* |

> ⚠️ **Two of those rows have a documented license discrepancy, and we are telling you rather than
> hiding it.** For the PM2.5 and HRSA sources, `catalog.data.gov` tags the record **ODbL**—a
> share-alike license—while the publisher's own page states public domain or no usage limitation.
> Federal works enter the public domain automatically under 17 U.S.C. § 105, and sibling records on
> the same catalog correctly carry `usa.gov/government-works`, which reads like a catalog metadata
> defect rather than a license grant. We cite the publisher. **If you bring your own data, this is
> exactly the shape of thing to check**—and see [Bringing your own data](#bringing-your-own-data),
> because share-alike is on the automatic-rejection list for anything you add.

### The hook you will hit in the first ten minutes

Section 2 of the notebook does the obvious thing and watches it fail, and it takes about forty
seconds.

You are siting a mobile clinic, so you rank your county's census tracts by air pollution and take
the top of the list. CDC publishes exactly that: **daily PM2.5 estimated at every census tract in
the United States**, four decimal places, 365 days a year.

In Fulton County the worst tract reads 9.81 µg/m³ and the best reads 8.98. **Nine percent, between
the single most polluted census tract in Atlanta and the single least polluted one.** The tenth and
ninetieth percentiles are separated by under five percent.

Then run the same measurement on a different column, for the same tracts:

| Column | p90 / p10 in Fulton County |
|---|---|
| Average PM2.5 | **1.05×** |
| Asthma prevalence | 1.48× |
| COPD prevalence | 3.70× |
| **Uninsured rate** | **3.11×** |

**Measured as spread above parity, the uninsured rate varies roughly forty-five times more across
these neighborhoods than the air does**—2.11 against 0.05. Houston, which ought to be the strongest pollution-gradient case in the United States,
separates its cleanest and dirtiest decile by nine percent. The Bronx—which has one of the most
documented asthma disparities in the country—separates by one and a third percent.

**Because it was never a tract-level measurement.** EPA's model runs on a **12-kilometer grid**, then
reports the value at each tract's center point. A 12 km cell covers dozens of tracts and they all
inherit the same number. The Bronx is about 10 km across. It is roughly one cell.

**Precision is not resolution.** The identifier is real, the decimals are real, the daily frequency
is real, and the spatial detail is not there. Nothing in the file says so, no query fails, and every
ranking you build on it looks perfectly reasonable.

That is the trap, and it sets up the shape of the whole challenge: **air quality tells you about
counties and about bad days; who is sick and who cannot reach care tells you about neighborhoods;
and your agent has to reason across both and say which claim came from which scale.**

### What the data actually says

Run the notebook and you get these for your own county. Here is Fulton, so the story lane can start
writing before the data lane finishes.

**326 census tracts. 1,066,710 people. 67 federally recognized care sites. And this:**

| Distance from a Fulton census tract | Median | Worst |
|---|---:|---:|
| To **any** care site | 2.8 km | 12.4 km |
| To one that will see somebody **uninsured** | 3.4 km | **28.6 km** |

**135 of 326 tracts—41%—are further from a clinic that will see them uninsured than from the nearest
clinic of any kind.** For one tract in ten, that gap is 15 km or more. **443,800 people live more
than 5 km from a safety-net site.**

And the tract at the top of the list when you cross need against distance:

> **Tract 13121010214.** 1,938 people. 14% of working-age adults uninsured. **43% of households
> have no vehicle.** 8.1 km from a clinic that will see them.

**For that tract, a car makes eight kilometers nothing. No car makes eight kilometers a day off
work**, two bus transfers, and childcare. That is the gap a mobile clinic exists to close, and it is
the strongest single argument your demo can make.

#### The warning that comes with those numbers

**Straight-line distance is not travel time.** We are measuring across a map, not along roads. A
tract two kilometers from a clinic on the far side of an interstate is not two kilometers from that
clinic.

**Our facility list is federal only.** County clinics, free clinics, charitable providers and
pharmacy minute-clinics are not in these files because no license-clean national list of them
exists. **Every distance above is therefore an upper bound**—the real nearest option may be closer
and we cannot see it. Do not report these as "the nearest care available." Report them as "the
nearest federally recognized site," which is what they are.

**Our distances stop at the county line.** `tract_access` measures to sites inside the county. A
tract on the border may be closer to a clinic in the next county. `care_sites_state` is there so you
can re-measure; if you do, say so.

**And the ranking is only as good as the estimate underneath it.** PLACES values are modeled, not
counted—a prediction about people like the people who live there, smoothed toward the mean. Two
tracts a percentage point apart are, quite possibly, the same tract.

### Nine defects you will meet, and why we show them to you

The notebook does not hand you a cleaned table, because these are the teaching:

1. **The 12 km grid wearing an 11-digit tract ID.** Described above. It is first on this list because
   it is the one that will silently ruin a ranking, and nothing about the file warns you.
2. **There are two HPSA layers and they mean opposite things.** Layer 11 is shortage *areas*—this
   neighborhood is underserved, a siting signal. Layer 9 is shortage *facilities*—this clinic serves
   an underserved population, which marks where care already **is**. Every FQHC is designated
   automatically just for being an FQHC, so the facility layer for Cook County includes a federal
   jail with a score of 3. **A team that merges the layers will be siting a mobile health clinic
   partly on the location of a prison.** They also spell the county key differently:
   `STATE_COUNTY_FIPS_CD` on one, `CMN_STATE_COUNTY_FIPS_CD` on the other.
3. **The obvious withdrawal filter does nothing.** `HPSA_WITHDRAWAL_DT IS NULL` matches every one of
   the 25,490 rows nationally—the column is empty. The real signal is `HPSA_STATUS_DESC`, and **39%
   of the national file is `Proposed For Withdrawal`.** In Fulton it is 99 of 99, which is why the
   default county ships an empty `shortage_areas` table rather than 99 fictional ones.
4. **A regional number wearing a county key.** `disease_weekly` has one row per county per week
   with a real county FIPS, so it looks county-level. The values are computed for a **Health
   Service Area**—Fulton shares its number with Clayton, DeKalb and Gwinnett; Houston's covers
   eight counties—and written onto every county in the group. An agent that says "COVID visits are
   rising in this neighborhood" from this file has made a claim the data cannot support. Note also
   that the `fips` column is typed as a **number** rather than text in this dataset, so it takes no
   quotes in a filter and California's counties are four digits, not five.
5. **`latitude` and `longitude` are transposed** in the air-quality files. In every row. Plot them as
   published and your county appears in the Indian Ocean—no error, no warning, just a wrong map. We
   ignore both columns and join on the tract ID; coordinates come from PLACES.
6. **`-999` is the missing-data sentinel** in CDC SVI. Leave it in and your averages are spectacular.
7. **Four columns that look like the answer and are empty.** The Rural Health Clinic layer
   publishes staffed clinical capacity per clinic—physicians, nurse practitioners, physician
   assistants, other personnel. That would be far better than a dot on a map, because two clinics
   are not equivalent supply if one has two physicians and the other has a part-time nurse
   practitioner. **Zero of them are populated, in all five states we checked.** A field that exists,
   is named correctly and sits right beside the real data is not the same as a field with data in
   it—**rank candidate columns by answered-value count before you choose one.**
8. **One column name has a trailing underscore and no other one does.** It is
   `mobility_crudeprev_`, so building column names in a loop gives you a `KeyError` on exactly one
   of the four disability measures.
9. **There are two uninsured columns and they disagree on purpose.** `pct_uninsured` from PLACES
   measures **adults aged 18 to 64**; `pct_uninsured_all_ages` from CDC SVI measures the whole
   civilian non-institutionalized population. Because Medicare covers almost everyone over 65,
   PLACES reads higher wherever a tract skews elderly. **Pick one as your headline number and say
   which.** A team that quotes both without noticing they measure different populations has an
   inconsistency in its own output that a judge will find in about fifteen seconds. A team that
   reports the difference *deliberately*, as a signal about age structure, has done something
   interesting—`burden_tracts` carries it as `uninsured_gap`.

**This is why the notebook's validation section has two verdicts, not one.** A **FAIL** means our
load is broken and you should stop. A **WARN** means the source publisher handed us something
untidy, and the offending rows are printed underneath so you can look at them. Do look at them—a
WARN is the kind of thing that ends up on a slide.

### What we deliberately excluded, and why this challenge is different

| Left out | Why |
|---|---|
| CDC SVI **Theme 3** and `RPL_THEMES` | Theme 3 is racial and ethnic minority status, and `RPL_THEMES` bakes it into a composite with no column to drop. See below |
| `FQHC_ADMIN_CONTACT_NM` / `_EMAIL` / `_PHONE_NUM` | Named individuals with email addresses and phone numbers. Individual-level personal data is an automatic rejection here, and the only reliable defense is never requesting the columns |
| Pharmacy locations | No federal file provides them without individual-level personal data. NPPES ships practitioners' names and often home addresses; the CMS pharmacy file has NPIs and no addresses |
| Mobile clinic registries | The one national candidate has no license, no bulk download, and asserts intellectual property over its contents |
| CDC WONDER | No sub-national API at all—*"Only national data are available for query by the API"*—plus a data use agreement restricting derived publication. Mortality is also a lagging indicator for a preventive program |
| Transit accessibility | **Access Across America: Transit 2024** is tract-level, FHWA-sponsored, the best dataset in the country for this—and **CC BY-NC 4.0**. Federal funding does not imply federal license terms, and this is the clearest example of that in the pack |
| Wastewater surveillance | Real, current and license-clean—but sewersheds span multiple counties and two thirds of US counties have no site. A corroborating signal, never a base layer |
| Anything patient-level | This agent plans where a van goes. It does not screen, triage, or advise anybody about their health |

**What makes this challenge different from the other four:** everything in that list is a *place*
you cannot see. This is the only challenge in the pack where the thing you are planning for is a
human body, and the line between "which neighborhood needs outreach" and "which person is sick" is
one you have to hold deliberately all afternoon. It is easy to cross by accident and there is no
version of crossing it that scores well.

### What "auditing the outcome" actually means

Three steps, about twenty minutes, and most teams will skip it.

1. **Produce your ranked list**—whichever tracts your agent says to send the van to.
2. **Join it back to the demographic columns**, including the ones you were not allowed to use as
   inputs.
3. **Compare to the county as a whole.** Is the distribution of your recommendations different from
   the distribution of the population?

Then say the answer out loud: **did the plan land where people cannot reach care, or where the model
found a proxy for something else?**

Report what you find, including if the answer is "no difference"—both answers are worth having, and
the team that checked is doing something the team that assumed is not.

**On this challenge the audit is not a compliance step, it is your architecture.** It requires a
component of your system that sees data the planner was denied, running outside the planner's
context so it does not simply defend the plan. If you build it properly, the audit *is* your second
agent and your demo has its best moment built in.

### Race is not a model input here. It is an audit of your output.

This is a rule for the whole event, and the reasoning matters more than the rule:

- Race genuinely **does** correlate with these outcomes. Do not claim otherwise—anyone who knows the
  literature will correct you, and they will be right.
- But it is a **proxy** for things we can measure directly. The causal variables here are structural
  and physical—insurance coverage, vehicle access, distance to a clinic, whether the neighborhood
  has a provider at all. Race is a cruder measurement of something we already have a better
  instrument for.
- **Removing the column does not remove the bias.** Correlated proxies survive. This is "fairness
  through unawareness" and it does not work.

The remedy is auditing what your agent recommends, not deleting an input. This is consistent with
Google's own published responsible-AI guidance.

---

## Going further

Everything above is what your agent has to do. Everything below is optional, and it is where the
difference between two teams actually shows up.

### What will set yours apart

Every team in this room starts from the identical eight tables, the same county list, the same
technology. **The core is not where you win.** Spend fifteen minutes deciding what *your* version
does that nobody else's will:

- **Say which scale every claim came from.** Tract, 12 km grid, facility point, or multi-county
  region. The single highest-value thing you can do, and most teams will blend them into one
  confident sentence instead.
- **Count what you cannot see.** A third of counties have no usable disease trend, eleven states
  have no transportation measure, and four of our six counties have no shortage areas. **"No signal"
  is not "no problem",** and an agent that reports the difference is doing the job.
- **Make the disagreement visible.** If your audit contradicts your planner, show it happening
  rather than resolving it silently. This is the demo moment your architecture buys you and almost
  nobody will build the interface for it.
- **Load the confidence intervals.** Every PLACES measure has a `_crude95ci` twin. If two tracts
  differ by less than their intervals overlap, your ranking is decorative. It is a two-line change
  and a strong add-on.
- **Use the pre-computed percentile ranks.** CDC SVI ships `EPL_*` columns—two of them are already
  in `burden_tracts` as `pctile_no_vehicle` and `pctile_uninsured`; the rest are one `wanted` list
  entry away in section 5 of the notebook. Every variable is already ranked 0 to 1 against every
  tract in the country. For a "rank the neighborhoods" problem that is usually the column you
  actually want, and most teams miss it and re-derive it badly.
- **Use opening hours as capacity.** The HRSA health center layer carries `TOT_OPER_HR_PER_WEEK`,
  and no other layer has it. A clinic open eight hours a week and one open sixty are not the same
  supply. Across the five states we measured the median site runs 40 to 43 hours, and individual
  sites range from **0 to 168**—a full week. It is close to fully populated, and treating a facility
  list as a list of equivalent dots throws it away.
- **Check your exceedance ranking against the model's own error.** `ds_pm_stdd` is in the source
  file (not in `exposure_tracts`—cell 22 of the notebook pulls it for one tract; extend that
  query). A sampled daily estimate came back as 3.65 with a standard error of 1.32, so near a
  threshold whether a day counts is partly the model's residual rather than the air.
- **Add ozone.** Dataset `hf2a-3ebq`, for a summer respiratory story. Its keys are numeric so `LIKE`
  will not work, its years and its tract set differ from the PM2.5 file, and you must join on the
  intersection and report both row counts. About fifteen lines, and genuinely good.
- **Write the flyer.** The fourth part of the Clinic Plan is the part everybody will cut for time,
  and it is the part the challenge is named for.
- **Bring a dataset nobody else has**—your county's own clinic roster, a transit GTFS feed, a state
  licensing database. (See below—check the license first.)

Read [how you'll be judged](#how-youll-be-judged) *before* you decide. It's at the bottom, it takes
two minutes, and it will change what you build.

### The add-on we'd build if we had another four hours

The data section admits something: **there is no license-clean federal dataset of travel time to
health care, and no national list of the free and county clinics people actually use.** We looked.
Both gaps sit exactly on top of the population this challenge is about.

So build the thing that asks the van.

**A field-report agent.** The nurse practitioner who ran Saturday's clinic talks to it on the drive
back, and it produces the record. Not a form—a conversation. Because a form gets you *"42 patients
seen"*, and an agent hears *"we were parked at the church but everyone who came walked from the
apartments on the other side of the highway, and four people asked if we take Medicaid"* and asks
the follow-up that matters: **would this have worked one street over?**

Why this is worth your time rather than just worthy:

- **It closes the loop on our stated limitation.** We told you straight-line distance is not travel
  time and that our clinic list is incomplete. You went and got the ground truth. That is a very
  strong thing to say in a demo.
- **Its output feeds your differentiator directly.** Your planner ranks, your auditor checks, and now
  a third input tells both of them they were wrong about a specific street. A system that can revise
  its own recommendation from feedback is doing something a query cannot.
- **It is cheaper than it looks.** A handful of appends to BigQuery with nobody competing for the
  same row, and you already have the tract list to walk.

---

## Bringing your own data

**You're not limited to what we provide.** If your team knows a dataset that would make this better,
bring it. Thoughtful sourcing is exactly the judgment this challenge rewards.

**Augment, don't replace.** Get the core working first. "Let's find better data" is one of the most
reliable ways to lose ninety minutes and have nothing to demo.

**Check the license before you load it.** This is a publicly branded event and winning projects get
promoted. Anything you bring has to clear the same bar we applied to ourselves:

| | |
|---|---|
| ❌ No **NonCommercial** (NC) | Winners are promoted commercially |
| ❌ No **NoDerivatives** (ND) | Building on the data is the whole point |
| ❌ No **share-alike** (ODbL, CC BY-SA) | It would encumber what *you* build |
| ❌ No **individual-level personal data** | Aggregate public statistics only |
| ❌ No **unstated license** | No license means no rights granted |
| ✅ Public domain, CC0, US Government works | Safe |

**The trap most likely to catch you on this challenge:** *Access Across America: Transit 2024* is
tract-level, federally sponsored, and the best transit-accessibility dataset in the United States.
It is licensed **CC BY-NC 4.0**. It is exactly what you want and you cannot use it. **Federal funding does not imply federal license terms**, and this
domain is full of that shape—university-hosted, agency-funded, restrictively licensed.

**And one that's specific to you:** health data is saturated with files that are technically
aggregate and practically about individuals. Several look like the answer to a siting problem and
ship a named person in a column. **If a row could be one person, it is an automatic rejection**,
however useful it would have been. The two we turned down for exactly this are named in the
exclusions table above, and saying so in your demo is a better answer than quietly using them.

---

## What's in this repository

```
README.md                             this file
notebooks/
  c5_01_load_explore.ipynb            The main artifact. Run this first
  c5_90_publish_snapshot.ipynb        ROI maintainers only. You do not need it
scripts/
  load.sh                             Headless fallback if Colab is unavailable
data/                                 Empty. Everything lives in BigQuery, in your project
agent/
  README.md                           What yours has to do, and the ADK API as it behaves today
                                      Empty otherwise. Your agent goes here
```

`c5_90_publish_snapshot.ipynb` is for ROI maintainers: it regenerates the Cloud Storage snapshot
that `scripts/load.sh` reads from. If you run it you will get a permissions error, because you do not
have write access to our bucket. That is expected, and you never need it.

`agent/` is empty on purpose. We built the on-ramp—every federally recognized care site in your
county with coordinates, the tracts around them with disease burden and insurance and vehicle
access, the federal shortage designations with the withdrawal trap already filtered, the air at the
only scale it works, the current disease signal with its real resolution stated, both distances
computed for every tract, the licenses checked, and a validation suite that tells you plainly what
is wrong with all of it. We didn't build the vehicle. [`agent/README.md`](agent/README.md)
restates what yours has to do, and carries the ADK API details you will need in the first ten
minutes.

---

## How you'll be judged

**"Finished" is not the goalpost.** Almost nobody completes everything they set out to do in 4.5
hours—that's the design, not a failure. A team that gets three quarters of the way with clear
reasoning and honest limitations will beat a team that demos something polished and hollow.

**You are judged against the track you chose**, not against a fixed idea of the right answer. A
siting team is expected to produce a defensible calendar and argue for the ranking it picked; an
explanation team is expected to produce something a person at a bus stop can read, in more than one
language. Neither is marked down for not looking like the other—and whichever you demo, judges will
look for the two agents behind it. Say which track you took, early.

**Judges score your submission, not a conversation.** They work from your repo, your Skills
project, your deck and your pitch video, after the event, with no follow-up questions. The
questions below are what they are looking for; put the answers in the deck or the video, in those
words, rather than waiting to be asked.

| Dimension | Weight | The question judges are asking |
|---|---:|---|
| **Impact & insight** | 30 | Would an outreach lead actually use this? Is the plan specific enough to put on a calendar? |
| **Technical execution** | 30 | Does it work, and is the orchestration genuine—agents that pass state and disagree—rather than three prompts in a trench coat? |
| **Rigor & judgment** | 25 | Can you defend the decisions you made along the way? |
| **Craft & communication** | 15 | Does the short pitch land, does the quick demo work, can you justify your interface? |
| **Bonus—range** | **+10** | Technology breadth and ambition that *serves* the solution |

Bonus sits **on top** of the 100, so ambition can't cannibalize the core. Nail the fundamentals and
add nothing, and you can still win. Wire up five services with no coherent clinic plan, and you
can't win on breadth alone.

### What "Rigor & judgment" actually means

This is the one teams under-invest in, because it's least visible in a demo. It's a quarter of your
score and the easiest place to stand out. Four concrete things:

**Data decisions you can defend.** What does "needs the van" mean in your agent, and why that
threshold? Which of your figures are measured and which are modeled? Which are tract-level and
which are a multi-county region? If you brought your own dataset, do you know its license?

**Validation.** Did you check your tables before building, or assume no error meant no problem? The
notebook ships a validation section with two verdicts rather than one—using it, and saying what it
told you, counts. The WARNs are real defects in federal data that will otherwise end up in your
totals.

**Bias handling.** Did you run the [equity audit](#what-auditing-the-outcome-actually-means)? On this
challenge that is not optional and it is not a footnote—it is a requirement, and it is also the
reason your architecture has more than one agent. Bring the numbers, not the intention.

**Knowing what your system can't do.** Air quality cannot separate neighborhoods. The disease file
cannot describe a street. Your clinic list is federal only, so every distance is an upper bound.
Four of six counties have no shortage areas and two have no disease trend at all. A team that
volunteers its limitations shows more skill than one that oversells—and judges are told to reward it.

One warning worth internalizing: **in this domain a confident wrong answer is the worst possible
output.** An agent that says "respiratory illness is rising in this neighborhood" from a
four-county number, or ranks tracts on an air-quality difference of two percent, has produced
something plausible, specific and false about people's health. A judge who asks "which scale did
that claim come from?" should get a good answer.

### A note on decisions generally

Several places in this challenge ask you to choose rather than follow instructions—which county,
which track, what "needs the van" means, how many agents and what each one is forbidden to see, how
to weigh a modeled estimate against a measured distance, what to cut when you're behind. **None of
those have a single right answer, and judges are not checking them against a key.** They're asking
whether you made the choice on purpose and can say why.

---

## Reference

**Your differentiator**
[ADK documentation](https://adk.dev/)—start here
·
[Multi-agent systems](https://adk.dev/workflows/)—the patterns, and which one you want
·
[Agent Runtime](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/runtime)—deployment
·
[`agent/README.md`](agent/README.md)—the API as it actually behaves today, verified 2026-08-10

**The rest of the stack**
[MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox)—named, parameterized tools
·
[BigQuery MCP server](https://docs.cloud.google.com/bigquery/docs/use-bigquery-mcp)
·
[BigQuery geospatial functions](https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/geography_functions)—`ST_DISTANCE`, `ST_GEOGPOINT`
·
[Antigravity](https://antigravity.google/docs/getting-started)—IDE and CLI

**Our data sources, if you want to check our work**
[CDC PLACES](https://www.cdc.gov/places/)
·
[CDC/ATSDR Social Vulnerability Index](https://www.atsdr.cdc.gov/place-health/php/svi/)
·
[CDC Daily Census Tract-Level PM2.5](https://data.cdc.gov/d/vpk8-vfhm)
·
[HRSA data warehouse](https://data.hrsa.gov/)
·
[CDC NSSP emergency department trends](https://data.cdc.gov/d/rdmq-nq56)

> ⚠️ **This agent plans outreach. It does not practice medicine.** Everything here is aggregate and
> place-based by design, and the line is not a formality: an agent that moves from "this
> neighborhood has a high modeled prevalence of diabetes" to anything resembling advice about a
> person has left the challenge. Keep your framing on where the van goes and why, and you will never
> meet that boundary. If your demo shows an agent talking to a patient, you have built the wrong
> thing.

---

## Getting help

Ask your table captain first. Every table has one: not a judge, a consultant who sits with you for
the day. Then the ROI facilitator on the floor, and the event's Discord channel, which the organizers
use for direct questions during the day. Whatever you're stuck on has probably already been solved at
another table.

To report a problem with the data or the notebook, run the **diagnostic cell** at the bottom of the
notebook and share what it prints. One block, everything a coach needs, beats a screenshot every
time.

Three failures common enough to name:

**A table that loads with the right row count and no data in it.** `disease_weekly` in Santa Clara
and the Bronx has 201 rows and every respiratory column NULL, because CDC publishes nothing for
those Health Service Areas. The notebook says so in a WARN. It is not a broken load.

**An empty `shortage_areas`.** Legitimate in four of our six counties. Fulton's 99 designations are
all proposed for withdrawal and the other three counties have none at all. Check
[the picking table](#now-pick-your-county) before you assume something went wrong.

**A join returning zero rows on a California county.** Seven states have a FIPS code below 10, and
tract IDs stored as numbers lose the leading zero—`06085` becomes `6085`, eleven characters become
ten, and nothing raises. Every join in the notebook pads to eleven characters. Do the same for
anything you add.
