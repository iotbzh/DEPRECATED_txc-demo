#!/bin/sh

export LANG=

infile=nyc-downtown-crosstown.json
outfile=nyc-downtown-crosstown.txt

cat $infile |
tr '{":,}' ' ' |
awk '
  NF==8 {print 1000*$8, $2, $4, $6}
  NF==6 {print 1000*$6, $2, $4, 0}
' |
sort -k 1g -s |
awk '
  NR==1 {x=$1}
  1     {y=$1; $1=y-x; print; x=y}
' |
awk '
  { printf "{ %s, %s, %s, %s },\n", $1, $2, $3, $4 }
' |
cat > $outfile

