#!/bin/sh

echo
printf "Event summary of %s\n" "$@"
cat "$@" |
tr '{":,}' ' ' |
awk '{print $2}' |
LANG= sort |
uniq -c
echo

