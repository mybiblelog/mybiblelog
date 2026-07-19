// Maestro runScript: recover a one-time verification code from the test-only
// email seam and expose it as `output.code` for the calling flow.
//
// Requires (passed via `maestro test -e ...`, see scripts/e2e/run.mjs):
//   E2E_API_URL         base URL of the API under test (e.g. http://localhost:8080)
//   E2E_BYPASS_SECRET   value for the x-test-bypass-secret header
// And (passed via the runScript `env:` block):
//   EMAIL_TO            recipient address to look up
//   EMAIL_SUBJECT       subject substring to match (e.g. "Reset Password")
//
// Emails are recorded immediately in non-production, but off the send queue, so
// a few rapid retries cover the tiny write race.
var code = null;
var attempts = 0;
while (code === null && attempts < 80) {
  attempts++;
  var url =
    E2E_API_URL +
    '/api/test/emails?to=' +
    encodeURIComponent(EMAIL_TO) +
    '&subject=' +
    encodeURIComponent(EMAIL_SUBJECT);
  var response = http.get(url, { headers: { 'x-test-bypass-secret': E2E_BYPASS_SECRET } });
  if (response && response.ok) {
    var body = json(response.body);
    if (body && body.data && body.data.length > 0) {
      var email = body.data[0];
      var content = email.html || email.text || '';
      var match = content.match(/code=([0-9]{6})/);
      if (match) {
        code = match[1];
      }
    }
  }
}
output.code = code;
