import Link from "next/link";
import { DEMO_DELIVERY_ID, DEMO_RUN_ID } from "@/lib/constants/delivery";

const flow = [
  { number: "01", title: "予定変更", text: "受取人が置き配へ1タップ変更" },
  { number: "02", title: "即時共有", text: "ドライバー画面へ3秒以内に反映" },
  { number: "03", title: "ETA更新", text: "順番はそのまま、後続時刻を前倒し" },
];

export default function Home() {
  const runId = process.env.NEXT_PUBLIC_DEMO_RUN_ID || DEMO_RUN_ID;
  const deliveryId =
    process.env.NEXT_PUBLIC_DEMO_DELIVERY_ID || DEMO_DELIVERY_ID;

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950">
      <header className="relative z-10 border-b border-white/10 bg-[#0b1f3a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-500 font-black shadow-lg shadow-blue-950/30">
              S
            </span>
            <div>
              <p className="font-bold leading-tight">スマート配送コンパス</p>
              <p className="text-[10px] tracking-[0.16em] text-blue-200">
                IN HIROSHIMA
              </p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200">
            動作確認モック
          </span>
        </div>
      </header>

      <main>
        <section className="relative bg-[#0b1f3a] text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-40 size-[520px] rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-48 left-1/4 size-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="route-grid absolute inset-0 opacity-20" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                <span className="size-1.5 rounded-full bg-cyan-300" />
                受取人とドライバーを、やさしくつなぐ
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
                予定が変わっても、
                <br />
                <span className="text-cyan-300">配送は止まらない。</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                置き配への変更をリアルタイムに共有。配送順を変えずに滞在時間と到着予定だけを更新する、東広島発の配送支援モックです。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400"
                  href={`/driver?run=${runId}`}
                >
                  ドライバー画面を開く <span>→</span>
                </Link>
                <Link
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10"
                  href={`/recipient/${deliveryId}`}
                >
                  受取人デモを試す
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                LINE・AWSには未接続です。すべてローカルのデモデータで動作します。
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-400/20 to-cyan-300/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-200">本日の配送</p>
                    <p className="mt-1 text-lg font-bold">西条・6件コース</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                    ● 配送中
                  </span>
                </div>
                <div className="mt-7 space-y-0">
                  {["西条中央", "西条町寺家", "八本松町", "高屋町"].map(
                    (name, index) => (
                      <div className="flex gap-4" key={name}>
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex size-9 items-center justify-center rounded-xl text-xs font-bold ${index === 2 ? "bg-teal-300 text-teal-950 ring-4 ring-teal-300/15" : "bg-blue-400 text-white"}`}
                          >
                            {index + 1}
                          </span>
                          {index < 3 && (
                            <span className="h-8 border-l border-dashed border-blue-200/30" />
                          )}
                        </div>
                        <div className="flex flex-1 items-start justify-between border-b border-white/8 pb-3">
                          <div>
                            <p className="text-sm font-bold">{name}</p>
                            <p className="mt-0.5 text-xs text-blue-200">
                              {index === 2
                                ? "置き配 · 滞在10秒"
                                : "対面受取 · 滞在5分"}
                            </p>
                          </div>
                          <p className="font-mono text-sm text-slate-300">{`${9 + Math.floor(index / 2)}:${[12, 25, 37, 58][index]}`}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-5 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
                  <p className="text-xs font-bold text-teal-200">
                    リアルタイム更新
                  </p>
                  <p className="mt-1 text-sm text-white">
                    3番目が置き配へ。後続ETAを4分50秒前倒ししました。
                  </p>
                  <p className="mt-1 text-xs text-teal-100/70">
                    配送順は変更されていません。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              順番を守りながら、時間だけを賢く更新
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {flow.map((item) => (
              <article
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                key={item.number}
              >
                <span className="text-sm font-black text-blue-600">
                  {item.number}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Smart Delivery Compass in Hiroshima — Local mock</p>
          <p>Mock routing · Supabase Realtime · Next.js</p>
        </div>
      </footer>
    </div>
  );
}
