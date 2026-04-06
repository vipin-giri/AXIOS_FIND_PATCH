const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = process.argv[2] || process.cwd();

const IGNORE_DIRS = ["node_modules", ".git", "dist", "build"];

function isIgnored(dirName) {
  return IGNORE_DIRS.includes(dirName);
}

function updateAxios(dir) {
  try {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      console.log(`Updating Axios in: ${dir}`);
      execSync("npm install axios@latest", {
        cwd: dir,
        stdio: "inherit"
      });
    }
  } catch (err) {
    console.error(`Failed in ${dir}:`, err.message);
  }
}

function patchCode(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf-8");

    let modified = false;

    // Detect unsafe patterns
    const unsafePatterns = [
      /axios\.(get|post|request)\((.*?)req\.(query|body|params)/g,
      /axios\.(get|post)\((.*?)\+/g
    ];

    unsafePatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        modified = true;
      }
    });

    if (!modified) return;

    console.log(`Patching file: ${filePath}`);

    // Replace unsafe axios calls with validation wrapper
    content = content.replace(
      /axios\.(get|post|request)\((.*?)\)/g,
      (match, method, args) => {
        return `axios.${method}(secureURL(${args}))`;
      }
    );

    // Add validation function if missing
    if (!content.includes("function secureURL")) {
      const validationFunction = `
function secureURL(url) {
  try {
    const parsed = new URL(url);

    // Allow only http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Blocked protocol");
    }

    // Block localhost / internal IPs (basic SSRF protection)
    const blockedHosts = ["127.0.0.1", "localhost"];
    if (blockedHosts.includes(parsed.hostname)) {
      throw new Error("Blocked internal host");
    }

    return url;
  } catch (err) {
    throw new Error("Invalid or unsafe URL");
  }
}

`;
      content = validationFunction + content;
    }

    fs.writeFileSync(filePath, content, "utf-8");

  } catch (err) {}
}

function scanAndPatch(dir) {
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);

    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!isIgnored(item)) {
          updateAxios(fullPath);
          scanAndPatch(fullPath);
        }
      } else {
        if (
          item.endsWith(".js") ||
          item.endsWith(".ts") ||
          item.endsWith(".jsx")
        ) {
          patchCode(fullPath);
        }
      }
    } catch (err) {}
  });
}

console.log("Starting deep Axios patch...\n");

updateAxios(ROOT_DIR);
scanAndPatch(ROOT_DIR);

console.log("\nPatch process complete");