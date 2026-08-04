import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const isLocalOnly = process.argv.includes("--local");
const children = new Set();
let shuttingDown = false;
let supabaseStarted = false;

function run(command, args, options = {}) {
  return spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    detached: process.platform !== "win32",
    ...options,
  });
}

function runBlocking(command, args) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
}

function register(child, label) {
  children.add(child);
  child.once("exit", (code, signal) => {
    children.delete(child);
    if (!shuttingDown) {
      console.error(
        `\n[停止] ${label} が終了しました (${signal ?? `code ${code}`})。`,
      );
      void shutdown(1);
    }
  });
  return child;
}

function stopChild(child) {
  if (!child.pid) return;

  try {
    if (process.platform === "win32") {
      child.kill("SIGTERM");
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  } catch {
    // The process may already be stopped.
  }
}

function updatePublicUrl(publicUrl) {
  const envPath = ".env";
  if (!existsSync(envPath)) {
    throw new Error(
      ".env がありません。先に cp .env.template .env を実行してください。",
    );
  }

  const source = readFileSync(envPath, "utf8");
  const nextLine = `LINE_PUBLIC_SITE_URL=${publicUrl}`;
  const nextSource = /^LINE_PUBLIC_SITE_URL=.*$/m.test(source)
    ? source.replace(/^LINE_PUBLIC_SITE_URL=.*$/m, nextLine)
    : `${source.trimEnd()}\n${nextLine}\n`;

  if (nextSource !== source) {
    writeFileSync(envPath, nextSource, { mode: 0o600 });
    console.log(`[設定] LINE_PUBLIC_SITE_URL を ${publicUrl} に更新しました。`);
  }
}

function startTunnel() {
  return new Promise((resolve, reject) => {
    const tunnel = spawn(
      "cloudflared",
      ["tunnel", "--url", "http://127.0.0.1:3002", "--no-autoupdate"],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["inherit", "pipe", "pipe"],
        detached: process.platform !== "win32",
      },
    );
    register(tunnel, "Cloudflareトンネル");

    let output = "";
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved)
        reject(new Error("Cloudflareの公開URLを取得できませんでした。"));
    }, 30_000);

    function consume(chunk, stream) {
      const text = chunk.toString();
      stream.write(text);
      output = `${output}${text}`.slice(-12_000);
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);

      if (match && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(match[0]);
      }
    }

    tunnel.stdout.on("data", (chunk) => consume(chunk, process.stdout));
    tunnel.stderr.on("data", (chunk) => consume(chunk, process.stderr));
    tunnel.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    tunnel.once("exit", () => {
      clearTimeout(timeout);
      if (!resolved)
        reject(new Error("Cloudflareトンネルが起動前に終了しました。"));
    });
  });
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("\n[終了] スマ配の開発環境を停止しています…");
  for (const child of children) stopChild(child);

  if (supabaseStarted) {
    runBlocking("pnpm", ["exec", "supabase", "stop"]);
  }

  console.log("[終了] すべて停止しました。");
  process.exit(exitCode);
}

async function main() {
  if (!existsSync("package.json") || !existsSync("supabase/config.toml")) {
    throw new Error("プロジェクトのルートディレクトリで実行してください。");
  }

  console.log("[1/4] Supabaseを起動しています…");
  const supabase = runBlocking("pnpm", ["exec", "supabase", "start"]);
  if (supabase.status !== 0)
    throw new Error("Supabaseを起動できませんでした。");
  supabaseStarted = true;

  let publicUrl = null;
  if (!isLocalOnly) {
    console.log("[2/4] Cloudflareトンネルを起動しています…");
    publicUrl = await startTunnel();
    updatePublicUrl(publicUrl);
  } else {
    console.log("[2/4] ローカルモードのため公開トンネルを省略します。");
  }

  console.log("[3/4] LINE Webhookプロキシを起動しています…");
  register(run("node", ["scripts/line-webhook-proxy.mjs"]), "LINEプロキシ");

  console.log("[4/4] Webアプリを起動しています…");
  register(
    run("pnpm", ["dev", "--hostname", "127.0.0.1", "--port", "3001"]),
    "Webアプリ",
  );

  console.log("\n========================================");
  console.log("スマ配の開発環境を起動しました");
  console.log("ドライバー画面: http://127.0.0.1:3001/driver");
  console.log("Supabase Studio: http://127.0.0.1:54323");
  if (publicUrl) {
    console.log(`公開URL: ${publicUrl}`);
    console.log(`LINE Webhook URL: ${publicUrl}/api/line/webhook`);
    console.log(
      "※ URLが前回と変わった場合はLINE Developers側も更新してください。",
    );
  }
  console.log("終了するときは Control+C を押してください。");
  console.log("Supabaseが残った場合は pnpm demo:stop で停止できます。");
  console.log("========================================\n");

  await new Promise(() => {});
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => void shutdown(0));
}

main().catch((error) => {
  console.error(
    `\n[起動失敗] ${error instanceof Error ? error.message : error}`,
  );
  void shutdown(1);
});
