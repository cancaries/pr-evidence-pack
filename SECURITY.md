# Security Policy

`pr-evidence-pack` is a local-first CLI. It reads git metadata and writes
Markdown files. It should not send repository data to a network service.

## Supported versions

Security fixes are accepted for the latest released version.

## Reporting a vulnerability

Please open a private security advisory on GitHub if available. If that is not
available, open an issue with minimal reproduction details and avoid posting
sensitive repository data.

## Design expectations

- No network calls in the default CLI path.
- No execution of user-supplied test commands. The tool records commands that
  were run by the contributor; it does not run them.
- No secret scanning claims. Generated evidence may include paths or notes
  supplied by the user, so review output before posting it publicly.
