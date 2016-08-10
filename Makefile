
.PHONY: all

all: txc-parse-only txc-parse-print txc-play txc-play-speed txc-binding.so ctxc-binding.so

txc-parse-only: txc-parse-only.c
	gcc -O2 txc-parse-only.c -o txc-parse-only -ljson-c

txc-parse-print: txc-parse-print.c
	gcc -O2 txc-parse-print.c -o txc-parse-print -ljson-c

txc-play: txc-play.c
	gcc -O2 txc-play.c -o txc-play -ljson-c

txc-play-speed: txc-play-speed.c
	gcc -O2 txc-play-speed.c -o txc-play-speed -ljson-c

txc-binding.so: txc-binding.c
	gcc -O2 txc-binding.c -o txc-binding.so -fPIC -shared $$(pkg-config --cflags --libs afb-daemon)

ctxc-binding.so: ctxc-binding.c
	gcc -O2 ctxc-binding.c -o ctxc-binding.so -fPIC -shared $$(pkg-config --cflags --libs afb-daemon)
