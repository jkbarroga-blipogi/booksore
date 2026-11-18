import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["--watch", "server/server.js"], { stdio: "inherit" }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], { stdio: "inherit" }),
];

let closing = false;

function stop(exitCode) {
  if (closing) return;
  closing = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

for (const child of children) {
  child.on("exit", (code) => {
    if (!closing) stop(code ?? 0);
  });
}
