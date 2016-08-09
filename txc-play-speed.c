#include <stdio.h>
#include <string.h>
#include <json-c/json.h>
#include <time.h>
#include <math.h>

double speed = 1.0;
int nowait = 0;
int started = 0;
double init = 0.0;
double prev = 0.0;
double base = 0.0;

void emit(json_object *object)
{
	struct json_object *ots;
	double t, i, f;
	int hasots;
	struct timespec ts;

	hasots = json_object_object_get_ex(object, "timestamp", &ots);
	if (started)
		t = !hasots ? prev : speed * (json_object_get_double(ots) - init);
	else {
		if (hasots) {
			init = json_object_get_double(ots);
			started = 1;
		}
		clock_gettime(CLOCK_REALTIME, &ts);
		base = (double)ts.tv_sec + ((double)ts.tv_nsec / 1000000000.0);
		t = 0;
	}
	json_object_object_add(object, "timestamp", json_object_new_double(t));

	if (t > prev) {
		f = modf(base + t, &i);
		ts.tv_sec = (time_t)i;
		ts.tv_nsec = (long)(1000000000.0 * f);
		prev = t;
		if (!nowait)
			clock_nanosleep(CLOCK_REALTIME, TIMER_ABSTIME, &ts, NULL);
	}

	printf("%s\n", json_object_to_json_string_ext(object, 0));
	json_object_put(object);
}

int process(const char *filename)
{
	int len;
	json_tokener *tokener;
	json_object *object;
	char line[1024];
	FILE *file;

	tokener = json_tokener_new();
	if (tokener == NULL) {
		fprintf(stderr, "can't allocate tokener\n");
		return 0;
	}

	file = fopen(filename, "r");
	if (file == NULL) {
		if (strcmp(filename, "-") != 0) {
			fprintf(stderr, "can't open %s\n", filename);
			json_tokener_free(tokener);
			return 0;
		}
		file = stdin;
	}

	while(fgets(line, (int)sizeof line, file)) {
		len = (int)strlen(line);
		if (len) {
			if (line[len-1] == '\n')
				len--;
			json_tokener_reset(tokener);
			object = json_tokener_parse_ex(tokener, line, len);
			if (object != NULL)
				emit(object);
		}
	}

	fclose(file);
	json_tokener_free(tokener);
	return 1;
}

int main(int ac, char **av)
{
	int i;

	/* should disable wait? */
	nowait = getenv("TXC_NOWAIT") != NULL;

	/* process the speed */
	if (getenv("TXC_SPEED") != NULL) {
		speed = atof(getenv("TXC_SPEED"));
		if (speed <= 0) {
			fprintf(stderr, "bad TXC_SPEED\n");
			return 1;
		}
		speed = 1.0 / speed;
	}

	/* process files */
	if (ac == 1)
		return !process("-");
	for (i = 1 ; i < ac ; i++)
		if (!process(av[i]))
			return 1;

	return 0;
}


