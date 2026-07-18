// Shared k6 options builder, driven entirely by environment variables so the
// same scripts can run a quick smoke test locally or a long ramp against a
// deployed URL without code changes.
//
// Env vars (all optional):
//   VUS       constant virtual users            (default 10)
//   DURATION  constant-VU test length           (default 30s)
//   STAGES    ramping profile, overrides VUS/DURATION when set.
//             Format: "dur:target,dur:target,..."  e.g. "30s:20,1m:20,10s:0"
//   P95_MS    p95 latency threshold in ms        (default 800)
//   MAX_FAIL  allowed request-failure rate       (default 0.01 = 1%)

function num(name, fallback) {
  const raw = __ENV[name];
  return raw === undefined || raw === '' ? fallback : Number(raw);
}

export function scenarioOptions() {
  const p95 = num('P95_MS', 800);
  const maxFail = num('MAX_FAIL', 0.01);

  const options = {
    thresholds: {
      http_req_failed: [`rate<${maxFail}`],
      http_req_duration: [`p(95)<${p95}`],
    },
    // Keep the end-of-test summary readable and comparable across runs.
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  };

  const stages = __ENV.STAGES;
  if (stages) {
    options.stages = stages.split(',').map((part) => {
      const [duration, target] = part.split(':');
      return { duration: duration.trim(), target: Number(target) };
    });
  }
  else {
    options.vus = num('VUS', 10);
    options.duration = __ENV.DURATION || '30s';
  }

  return options;
}

// Resolve the target base URL, trimming any trailing slash. Individual scripts
// supply their own default so `api.js` can default to the API port and
// `content.js` to the Nuxt port.
export function baseUrl(fallback) {
  const url = __ENV.BASE_URL || fallback;
  return url.replace(/\/+$/, '');
}
