const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.argv[2] || process.cwd();

// folders to ignore
const IGNORE_DIRS = ["node_modules", ".git", "dist", "build"];

let results = {
  axiosFiles: [],
  vulnerablePackages: [],
  ssrfRisks: []
};

function isIgnored(dirName) {
  return IGNORE_DIRS.includes(dirName);
}

function cleanVersion(version) {
  return version ? version.replace(/[^0-9.]/g, "") : "";
}

function isVulnerable(version) {
  const v = cleanVersion(version);
  return v && v < "1.6.0"; // adjust threshold if needed
}

function scanPackageJson(filePath) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const deps = { ...data.dependencies, ...data.devDependencies };

    if (deps && deps.axios) {
      const version = deps.axios;
      if (isVulnerable(version)) {
        results.vulnerablePackages.push({
          file: filePath,
          version
        });
      }
    }
  } catch (err) {}
}

function scanCodeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    if (content.includes("axios")) {
      results.axiosFiles.push(filePath);
    }

    // SSRF patterns
    const patterns = [
      /axios\.(get|post|request)\((.*?)req\.(query|body|params)/g,
      /axios\.(get|post)\((.*?)\+/g, // dynamic URL concat
      /axios\.(get|post)\((.*?)process\.env/g
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(content)) {
        results.ssrfRisks.push(filePath);
      }
    });

  } catch (err) {}
}

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);

    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!isIgnored(item)) {
          scanDirectory(fullPath);
        }
      } else {
        if (item === "package.json") {
          scanPackageJson(fullPath);
        }

        if (item.endsWith(".js") || item.endsWith(".ts") || item.endsWith(".jsx")) {
          scanCodeFile(fullPath);
        }
      }
    } catch (err) {}
  });
}

function printResults() {
  console.log("\n==== AXIOS SECURITY SCAN REPORT ====\n");

  console.log("Axios Usage Found In:");
  results.axiosFiles.forEach(f => console.log(" -", f));

  console.log("\nPotential Vulnerable Versions:");
  results.vulnerablePackages.forEach(p => {
    console.log(` - ${p.file} (version: ${p.version})`);
  });

  console.log("\nPossible SSRF Risks:");
  results.ssrfRisks.forEach(f => console.log(" -", f));

  console.log("\n==== SCAN COMPLETE ====\n");
}

console.log("Starting deep scan...\n");
scanDirectory(ROOT_DIR);
printResults();