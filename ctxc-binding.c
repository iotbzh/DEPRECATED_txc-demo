
#define  _GNU_SOURCE

#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <math.h>
#include <pthread.h>

#include <json-c/json.h>

#include <afb/afb-binding.h>
#include <afb/afb-service-itf.h>

static const struct afb_binding_interface *afbitf;
static struct afb_service srvitf;

static void callback(void *closure, int iserror, struct json_object *result)
{
	struct afb_req request = afb_req_unstore(closure);
	struct json_object *x, *resp = NULL;
	const char *info = NULL;

	if (result) {
		if (json_object_object_get_ex(result, "request", &x)
		 && json_object_object_get_ex(x, "info", &x))
			info = json_object_get_string(x);
		if (!json_object_object_get_ex(result, "response", &resp))
			resp = NULL;
	}
	if (iserror)
		afb_req_fail_f(request, "error", info);
	else
		afb_req_success(request, resp, info);
	afb_req_unref(request);
}

static void perform(struct afb_req request, const char *verb)
{
	struct afb_req *r = afb_req_store(request);
	if (!r)
		afb_req_fail(request, "error", "out of memory");
	else
		afb_service_call(srvitf, "txc", verb, json_object_get(afb_req_json(request)), callback, r);
}

static void start(struct afb_req request)
{
	perform(request, "start");
}

static void stop(struct afb_req request)
{
	perform(request, "stop");
}

static void subscribe(struct afb_req request)
{
	perform(request, "subscribe");
}

static void unsubscribe(struct afb_req request)
{
	perform(request, "unsubscribe");
}

// NOTE: this sample does not use session to keep test a basic as possible
//       in real application most APIs should be protected with AFB_SESSION_CHECK
static const struct afb_verb_desc_v1 verbs[]= {
  {"start",      AFB_SESSION_CHECK, start       , "start to play a trace"},
  {"stop",       AFB_SESSION_CHECK, stop        , "stop to play a trace"},
  {"subscribe",  AFB_SESSION_CHECK, subscribe   , "subscribes to the event of 'name'"},
  {"unsubscribe",AFB_SESSION_CHECK, unsubscribe , "unsubscribes to the event of 'name'"},
  {NULL}
};

static const struct afb_binding plugin_desc = {
	.type = AFB_BINDING_VERSION_1,
	.v1 = {
		.info = "stupid client for TXC (trace openXC)",
		.prefix = "ctxc",
		.verbs = verbs
	}
};

const struct afb_binding *afbBindingV1Register (const struct afb_binding_interface *itf)
{
	afbitf = itf;
	return &plugin_desc;
}

int afbBindingV1ServiceInit(struct afb_service service)
{
	srvitf = service;
	return 0;
}

void afbBindingV1ServiceEvent(const char *event, struct json_object *object)
{
/*
	static int n=0;
	if (++n % 1000) ; else printf("CTXC event %d!\n",n);
*/
}

