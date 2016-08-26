#include <stdio.h>
#include <string.h>
#include <json-c/json.h>

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
			json_object_put(object);
		}
	}

	fclose(file);
	json_tokener_free(tokener);
	return 1;
}

int main(int ac, char **av)
{
	int i;

	if (ac == 1)
		return !process("-");

	for (i = 1 ; i < ac ; i++)
		if (!process(av[i]))
			return 1;
	return 0;
}


