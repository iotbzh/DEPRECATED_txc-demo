#/bin/sh

bt="/tmp/$(basename $0)-$$"
trap "rm -f ${bt}*" EXIT

pat=${1:-afb-daemon}

pids=$(grep -l "$pat" /proc/*/comm | cut -d / -f 3)

echo
echo scanning processes:
for p in $pids; do
	echo "  " $p: $(tr '\0' ' ' < /proc/$p/cmdline)
done

for p in $pids; do
	echo $p --- $(tr '\0' ' ' < /proc/$p/cmdline)
done > ${bt}-proc

tbef=$(date +%s.%N)
for p in $pids; do
	echo $p $(awk '{print $14, $15, $14+$15}' /proc/$p/stat)
done > ${bt}-before

echo -n "started..."
read x

taft=$(date +%s.%N)
for p in $pids; do
	echo $p $(awk '{print $14, $15, $14+$15}' /proc/$p/stat)
done > ${bt}-after

join ${bt}-before ${bt}-after |
awk -v tb=$tbef -v ta=$taft '{
  print $1, 0.01*($5-$2), 0.01*($6-$3), 0.01*($7-$4), ($7-$4)/(ta-tb)"%"
}' |
join - ${bt}-proc
