#!/bin/bash

make --quiet

TIME() {
	\time -f "r=%e s=%S u=%U l=%P m=%Mk" "$@"
}

echo ----------------------------------------------------------
echo time to read the trace file
TIME cat traces_nyc_downtown-crosstown.json > /dev/null
echo
echo ----------------------------------------------------------
echo time to read+scan the trace file
TIME ./txc-parse-only traces_nyc_downtown-crosstown.json
echo
echo ----------------------------------------------------------
echo time to read+scan+print the trace file
TIME ./txc-parse-print traces_nyc_downtown-crosstown.json > /dev/null
echo
echo ----------------------------------------------------------
echo time to play the trace file
TXC_NOWAIT= TIME ./txc-play traces_nyc_downtown-crosstown.json > /dev/null
echo
echo ----------------------------------------------------------
echo time to play at speed the trace file
TXC_NOWAIT= TXC_SPEED=3.14159 TIME ./txc-play-speed traces_nyc_downtown-crosstown.json > /dev/null


