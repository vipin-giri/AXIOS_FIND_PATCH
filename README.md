# Axios Vulnerability Scanner and Patcher

A lightweight utility for scanning JavaScript and TypeScript projects for Axios usage, potentially vulnerable versions, and unsafe request patterns. It also offers an automated patch workflow to update Axios and harden insecure Axios calls.

## Features

- Recursive scanning of directories and files
- Detection of Axios usage in `.js`, `.ts`, and `.jsx` files
- Identification of Axios versions in `package.json`
- Basic vulnerable Axios version detection
- Pattern-based detection of potential SSRF/unsafe URL usage
- Automated patching of insecure Axios calls
- Automatic update of Axios to the latest version via `npm install axios@latest`

## Project Structure

```
.
├── check-axios-vuln.js   # Vulnerability detection script
├── patch.js              # Automated patching script
└── README.md
```

## Prerequisites

- Node.js v14 or higher
- npm installed
- A JavaScript or TypeScript project to scan

## Usage

### 1. Run the vulnerability scanner

Scan the current directory:

```bash
node check-axios-vuln.js
```

Scan a specific directory:

```bash
node check-axios-vuln.js /path/to/project
```

The scanner will report:

- Files containing `axios` usage
- `package.json` files with Axios dependencies
- Potential SSRF risk patterns in code

### 2. Apply automated patches

Patch the current directory:

```bash
node patch.js
```

Patch a specific directory:

```bash
node patch.js /path/to/project
```

The patcher performs:

- `npm install axios@latest` in project directories containing `package.json`
- Replacement of unsafe `axios.get`, `axios.post`, and `axios.request` calls with a `secureURL(...)` wrapper
- Injection of a simple URL validation helper for basic protocol and localhost/internal host blocking

## How it works

### `check-axios-vuln.js`

- Recursively walks directories while ignoring `node_modules`, `.git`, `dist`, and `build`
- Scans `.js`, `.ts`, and `.jsx` files for `axios` usage
- Loads `package.json` files and checks Axios dependency versions
- Flags patterns that may indicate SSRF risk with user-controlled URLs

### `patch.js`

- Updates Axios in directories with `package.json` files by running `npm install axios@latest`
- Looks for unsafe Axios calls and rewrites them to use `secureURL(...)`
- Adds a basic URL validation function if it is missing

## Important Notes

- This tool uses static, regex-based analysis and may miss complex cases or produce false positives.
- Automatic patching modifies source files. Review changes before deploying.
- Use version control (Git) before running the patch script.

## Limitations

- No AST-based parsing; detection is based on simple patterns
- No runtime verification or full semantic analysis
- URL validation is intentionally basic and should not replace full application security review

## Recommended workflow

1. Run the scanner
2. Review reported issues
3. Commit your existing codebase
4. Run the patch script
5. Review and test all changes

## Disclaimer

This repository is intended for educational and defensive security purposes only. Users are responsible for reviewing and validating any changes made by the patcher.