# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |


## Reporting a Vulnerability

Please file an issue in GitHub.

## Known Issues

This system MUST be used locally by trusted users, ONLY. Don't put in in/on the internet, as it has severe issues.

## Security References

### OWASP Findings
- [OWASP: Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP: Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)

### npm Packages
- [npm: shell-quote](https://www.npmjs.com/package/shell-quote)
- [npm: sanitize-filename](https://www.npmjs.com/package/sanitize-filename)

### Common Weakness Enumeration (CWE)
- [CWE-78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')](https://cwe.mitre.org/data/definitions/78.html)
- [CWE-88: Argument Injection or Modification](https://cwe.mitre.org/data/definitions/88.html)
- [CWE-22: Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')](https://cwe.mitre.org/data/definitions/22.html)
- [CWE-23: Relative Path Traversal](https://cwe.mitre.org/data/definitions/23.html)
- [CWE-36: Absolute Path Traversal](https://cwe.mitre.org/data/definitions/36.html)
- [CWE-73: External Control of File Name or Path](https://cwe.mitre.org/data/definitions/73.html)
- [CWE-99: Improper Control of Resource Identifiers ('Resource Injection')](https://cwe.mitre.org/data/definitions/99.html)
