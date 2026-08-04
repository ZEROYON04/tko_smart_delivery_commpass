import Link from "next/link";
import { DEMO_DELIVERY_ID, DEMO_RUN_ID } from "@/lib/constants/delivery";

const flow = [
  {
    number: "01",
    title: "受取方法を変更",
    text: "受取人が置き配などへ変更すると、ドライバーへ即時反映します。",
  },
  {
    number: "02",
    title: "東広島の実経路を表示",
    text: "実在する公共施設を配達先にし、道路に沿った経路と順番を地図で確認できます。",
  },
  {
    number: "03",
    title: "再配達を最適化",
    text: "戻り時間と会社別の時間帯を考慮し、残りの配達順と到着予定を組み直します。",
  },
];

const destinations = [
  "東広島市立美術館",
  "西条駅",
  "道の駅 西条のん太の酒蔵",
  "八本松駅",
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
                <span className="text-cyan-300">配送を止めない。</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                東広島市の実在地点と道路経路を地図に表示。通常の受取方法変更は順番を保ち、不在・時間帯変更時は戻り時間と会社別の時間枠を考慮して残りのルートを最適化します。
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
                配送情報・経路はダミーデータです。LINE Messaging
                APIと公開経路サービスの連携を確認できます。
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-blue-400/20 to-cyan-300/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-200">本日の配送</p>
                    <p className="mt-1 text-lg font-bold">東広島・6件コース</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                    ● 配送中
                  </span>
                </div>
                <div className="mt-7 space-y-0">
                  {destinations.map((name, index) => (
                    <div className="flex gap-4" key={name}>
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex size-9 items-center justify-center rounded-xl text-xs font-bold ${index === 2 ? "bg-teal-300 text-teal-950 ring-4 ring-teal-300/15" : "bg-blue-400 text-white"}`}
                        >
                          {index + 1}
                        </span>
                        {index < destinations.length - 1 && (
                          <span className="h-8 border-l border-dashed border-blue-200/30" />
                        )}
                      </div>
                      <div className="flex flex-1 items-start justify-between border-b border-white/8 pb-3">
                        <div>
                          <p className="text-sm font-bold">{name}</p>
                          <p className="mt-0.5 text-xs text-blue-200">
                            {index === 2 ? "時間帯指定あり" : "対面受取"}
                          </p>
                        </div>
                        <p className="font-mono text-sm text-slate-300">{`${9 + Math.floor(index / 2)}:${[12, 25, 37, 58][index]}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
                  <p className="text-xs font-bold text-teal-200">
                    再配達最適化
                  </p>
                  <p className="mt-1 text-sm text-white">
                    受取人の戻り時間から、配達可能な時間帯と残りの経路を再計算します。
                  </p>
                  <p className="mt-1 text-xs text-teal-100/70">
                    通常の置き配変更では配送順を維持します。
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
              実経路と時間枠を、ひとつの配送計画へ
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
          <p>OSRM routing · OpenStreetMap · Supabase Realtime · Next.js</p>
        </div>
      </footer>
    </div>
  );
}
