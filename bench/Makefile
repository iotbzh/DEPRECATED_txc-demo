
.PHONY: all

all: txc-parse-only txc-parse-print txc-play txc-play-speed txc-binding.so ctxc-binding.so

txc-parse-only: txc-parse-only.c
	$(CC) -O2 txc-parse-only.c -o txc-parse-only -ljson-c

txc-parse-print: txc-parse-print.c
	$(CC) -O2 txc-parse-print.c -o txc-parse-print -ljson-c

txc-play: txc-play.c
	$(CC) -O2 txc-play.c -o txc-play -ljson-c

txc-play-speed: txc-play-speed.c
	$(CC) -O2 txc-play-speed.c -o txc-play-speed -ljson-c

txc-binding.so: txc-binding.c
	$(CC) -O2 txc-binding.c -o txc-binding.so -fPIC -shared $$(pkg-config --cflags --libs afb-daemon)

ctxc-binding.so: ctxc-binding.c
	$(CC) -O2 ctxc-binding.c -o ctxc-binding.so -fPIC -shared $$(pkg-config --cflags --libs afb-daemon)

.PHONY:clean
clean:
	rm -f ctxc-binding.so txc-binding.so txc-play-speed txc-play txc-parse-print txc-parse-only

