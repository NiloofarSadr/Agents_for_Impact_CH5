# scripts/

Headless alternatives to the notebook, for when a Colab Enterprise runtime is slow or
unavailable.

`load.sh` reaches the same end state as `notebooks/c5_01_load_explore.ipynb`—the same eight tables,
in the same dataset, in your project. Use the notebook if you can: it only takes two to three
minutes, it explains what it's doing and why, and the explanations matter. Use this if you can't.

## Running it

From the **root of the repo**, in Cloud Shell:

```bash
bash scripts/load.sh              # loads Fulton County, GA—the default
bash scripts/load.sh 17031        # Cook County, IL
bash scripts/load.sh --list       # show every county we've published
bash scripts/load.sh --help       # usage
```

**It takes a five-digit county FIPS, not a state.** That is a deliberate difference from Challenge
4, and the reason is worth thirty seconds: **Santa Clara is `06085`, and the leading zero is part of
the code rather than decoration.** Type it as a number and you get `6085`, which matches nothing.
Seven states have a FIPS below 10 and the same habit will break the first join you write by hand, so
the script pads a four-digit argument and tells you it did.

Invoke it with `bash` rather than `./scripts/load.sh`. That way it works whether or not the file's
executable bit survived however your copy of this repo was created.

## It is safe to run more than once

Every table is fully replaced, never appended to. So if you cancel it halfway through, or you
aren't sure whether it finished, just run it again—the end state is the same either way. The same
is true if you change your mind about the county: the second run overwrites the first county's
tables rather than mixing the two.

## It will tell you when a county cannot support the challenge

The last thing the script prints is not about whether the load worked. It is about whether the
county you picked has the thing you are about to build on:

- **An empty `shortage_areas` is legitimate** and the script says so rather than failing. Four of
  our six counties have no live federal shortage designations, including the default.
- **`disease_weekly` can arrive with 201 rows and no data in any of them.** Santa Clara and the
  Bronx report `Data Unavailable` for every week. The script counts the usable weeks and says
  loudly when the answer is zero, because that is the only current layer in the challenge and it is
  invisible in a row count.
- **The safety-net gap can be flat.** If no tract in your county is further from a clinic that takes
  the uninsured than from the nearest clinic of any kind, the central measurement of this challenge
  does not exist there, and you want to know at minute five.

None of those stops the load. All three change what you should build.
