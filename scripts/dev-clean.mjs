import { rmSync } from "fs";
import { spawn } from "child_process";
import { execSync } from "child_process";

const PORTS = [3000, 3001, 3002];

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique"`,
        { encoding: "utf8" }
      );
      for (const pid of out.trim().split(/\s+/).filter(Boolean)) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        } catch {
          /* already gone */
        }
      }
    } else {
      execSync(`npx --yes kill-port ${port}`, { stdio: "ignore" });
    }
  } catch {
    /* port not in use */
  }
}

try {
  rmSync(".next", { recursive: true, force: true });
} catch {
  /* ignore */
}

for (const port of PORTS) {
  killPort(port);
}

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 0));
