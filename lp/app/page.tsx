const problems = [
  {
    number: "01",
    title: "受取人の予定が変わる",
    text: "配達予定に合わせて在宅していても、急な外出や予定変更が発生することがあります。",
  },
  {
    number: "02",
    title: "変更がすぐ伝わらない",
    text: "受取方法を変更したくても、配送直前ではドライバーへ情報が届かない場合があります。",
  },
  {
    number: "03",
    title: "不在と再配達が発生する",
    text: "ドライバーは現地まで移動した後に不在を知り、後でもう一度訪問する必要があります。",
  },
];

const values = [
  {
    label: "受取人",
    title: "予定変更を簡単に伝えられる",
    text: "置き配への変更や外出予定、戻り時間をスマートフォンから登録できます。",
  },
  {
    label: "ドライバー",
    title: "変更内容をすぐ確認できる",
    text: "受取人からの変更がリアルタイムに反映され、配送計画へ反映されます。",
  },
  {
    label: "配送会社",
    title: "再配達の負担を減らせる",
    text: "不在や待ち時間を減らし、限られた人員で効率的に配送できます。",
  },
];

const destinations = [
  {
    order: 1,
    name: "東広島市立美術館",
    time: "9:12",
    status: "配達完了",
  },
  {
    order: 2,
    name: "西条駅",
    time: "9:25",
    status: "配達完了",
  },
  {
    order: 3,
    name: "道の駅 西条のん太の酒蔵",
    time: "9:37",
    status: "置き配へ変更",
  },
  {
    order: 4,
    name: "八本松駅",
    time: "9:53",
    status: "到着予定を更新",
  },
];

function SectionLabel({
  number,
  children,
  light = false,
}: {
  number: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] ${
        light ? "text-cyan-200" : "text-blue-600"
      }`}
    >
      <span
        className={`h-px w-10 ${light ? "bg-cyan-300/60" : "bg-blue-600/50"}`}
      />
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

function RecipientPhone() {
  return (
    <div className="mx-auto w-full max-w-[330px] rounded-[42px] border-[8px] border-slate-900 bg-white p-3 shadow-2xl shadow-slate-950/20">
      <div className="mx-auto mb-5 h-5 w-24 rounded-full bg-slate-900" />

      <div className="rounded-[28px] bg-slate-50 p-5">
        <p className="text-xs font-bold text-blue-600">本日の配送予定</p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">到着予定</p>
            <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              10:30
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            あと約3件
          </span>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-400">現在の受取方法</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-xl">
              🏠
            </span>
            <div>
              <p className="font-bold text-slate-900">対面で受け取る</p>
              <p className="mt-0.5 text-xs text-slate-500">玄関先で受け取り</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-3xl border-2 border-cyan-400 bg-cyan-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-cyan-200 text-xl">
              📦
            </span>
            <div>
              <p className="font-bold text-slate-950">置き配へ変更</p>
              <p className="mt-0.5 text-xs text-slate-600">
                玄関前に置いてもらう
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-cyan-500 py-3 text-center text-sm font-bold text-white">
            変更内容を送信
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverScreen() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <div>
          <p className="text-xs text-blue-200">スマート配送コンパス</p>
          <p className="mt-1 font-bold">東広島・6件コース</p>
        </div>

        <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-300">
          ● 配送中
        </span>
      </div>

      <div className="grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[310px] overflow-hidden bg-[#e8eef5]">
          <div className="absolute inset-0 opacity-60">
            <svg
              aria-hidden="true"
              className="h-full w-full"
              viewBox="0 0 500 360"
            >
              <path
                d="M-20 110 C90 75 135 170 230 135 C325 100 380 35 520 75"
                fill="none"
                stroke="#ffffff"
                strokeWidth="24"
              />
              <path
                d="M70 -20 C115 85 80 175 165 230 C235 275 340 230 390 390"
                fill="none"
                stroke="#ffffff"
                strokeWidth="18"
              />
              <path
                d="M-20 300 C95 270 170 325 260 280 C335 242 410 260 520 215"
                fill="none"
                stroke="#ffffff"
                strokeWidth="16"
              />

              <path
                d="M52 250 C110 220 115 155 186 152 C255 150 270 89 354 92 C405 94 420 147 460 166"
                fill="none"
                stroke="#2563eb"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="9"
              />
            </svg>
          </div>

          <div className="absolute left-[8%] top-[65%] flex size-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xs font-black text-white shadow-lg">
            1
          </div>
          <div className="absolute left-[33%] top-[36%] flex size-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xs font-black text-white shadow-lg">
            2
          </div>
          <div className="absolute left-[66%] top-[17%] flex size-11 items-center justify-center rounded-full border-4 border-white bg-cyan-400 text-sm font-black text-cyan-950 shadow-lg">
            3
          </div>
          <div className="absolute right-[3%] top-[40%] flex size-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xs font-black text-white shadow-lg">
            4
          </div>

          <div className="absolute bottom-5 left-5 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-[10px] font-bold text-slate-400">
              変更を受信しました
            </p>
            <p className="mt-1 text-xs font-bold text-slate-900">
              3件目：対面受取 → 置き配
            </p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Delivery route
          </p>

          <div className="mt-4 space-y-1">
            {destinations.map((destination) => (
              <div
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  destination.order === 3
                    ? "bg-cyan-50 ring-1 ring-cyan-300"
                    : "bg-slate-50"
                }`}
                key={destination.order}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    destination.order === 3
                      ? "bg-cyan-400 text-cyan-950"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {destination.order}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {destination.name}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] ${
                      destination.order === 3
                        ? "font-bold text-cyan-700"
                        : "text-slate-500"
                    }`}
                  >
                    {destination.status}
                  </p>
                </div>

                <span className="font-mono text-sm font-bold text-slate-600">
                  {destination.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-hidden bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#071a33]/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500 font-black shadow-lg shadow-blue-950/30">
              S
            </span>

            <div>
              <p className="text-sm font-bold leading-none">
                スマート配送コンパス
              </p>
              <p className="mt-1 text-[9px] tracking-[0.18em] text-blue-200">
                SMART DELIVERY COMPASS
              </p>
            </div>
          </div>

          <p className="hidden text-xs font-bold text-blue-200 sm:block">
            SCROLL TO EXPLORE
          </p>
        </div>
      </header>

      <main>
        {/* ファーストビュー */}
        <section className="relative flex min-h-screen items-center overflow-hidden bg-[#071a33] pt-16 text-white">
          <div className="absolute inset-0">
            <div className="route-grid absolute inset-0 opacity-20" />
            <div className="absolute -right-48 top-0 size-[600px] rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -bottom-56 left-[15%] size-[520px] rounded-full bg-cyan-400/10 blur-3xl" />

            <svg
              aria-hidden="true"
              className="absolute bottom-0 right-0 h-[62%] w-[75%] opacity-30"
              viewBox="0 0 900 520"
            >
              <path
                d="M10 430 C160 390 160 230 310 260 C460 290 470 90 630 125 C730 148 760 230 900 170"
                fill="none"
                stroke="#38bdf8"
                strokeDasharray="8 14"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <circle cx="310" cy="260" fill="#22d3ee" r="10" />
              <circle cx="630" cy="125" fill="#22d3ee" r="10" />
              <circle cx="895" cy="172" fill="#22d3ee" r="10" />
            </svg>
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
            <div className="max-w-4xl">
              <p className="text-xs font-bold tracking-[0.24em] text-cyan-300 sm:text-sm">
                SMART DELIVERY COMPASS IN HIROSHIMA
              </p>

              <h1 className="mt-7 text-5xl font-black leading-[1.12] tracking-[-0.04em] sm:text-7xl lg:text-[88px]">
                予定が変わっても、
                <br />
                <span className="text-cyan-300">配送を止めない。</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300 sm:text-xl sm:leading-9">
                受取人の予定変更をドライバーへリアルタイムに共有し、
                配送ルートと到着予定を柔軟に調整する配送支援システム。
              </p>
            </div>

            <div className="mt-16 flex items-center gap-4 text-xs font-bold tracking-[0.16em] text-blue-200">
              <span className="flex h-12 w-7 justify-center rounded-full border border-white/30 pt-2">
                <span className="h-2 w-1 animate-bounce rounded-full bg-cyan-300" />
              </span>
              下へスクロール
            </div>
          </div>
        </section>

        {/* 問題提起 */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <SectionLabel number="01">The problem</SectionLabel>

            <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <h2 className="text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                配達直前まで、
                <br />
                <span className="text-blue-600">受取人の予定は変わる。</span>
              </h2>

              <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                急な外出や予定変更は珍しいことではありません。しかし、
                その情報が配送現場へ伝わらなければ、不在や待ち時間、
                再配達につながります。
              </p>
            </div>

            <div className="mt-16 grid gap-5 md:grid-cols-3">
              {problems.map((problem, index) => (
                <article
                  className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-slate-50 p-7 sm:p-8"
                  key={problem.number}
                >
                  <span className="text-5xl font-black text-slate-200">
                    {problem.number}
                  </span>

                  <h3 className="mt-8 text-xl font-bold text-slate-950">
                    {problem.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {problem.text}
                  </p>

                  {index < problems.length - 1 && (
                    <span className="absolute -bottom-4 right-7 text-6xl font-thin text-blue-200 md:-right-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2">
                      →
                    </span>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 問題の結果 */}
        <section className="relative overflow-hidden bg-[#fff7ed]">
          <div className="absolute right-0 top-0 size-96 rounded-full bg-orange-200/40 blur-3xl" />

          <div className="relative mx-auto grid min-h-[80vh] max-w-7xl items-center gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2">
            <div>
              <SectionLabel number="02">What happens</SectionLabel>

              <h2 className="mt-8 text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                たった1件の不在が、
                <br />
                配送全体へ影響する。
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                現地へ到着してから不在が分かると、ドライバーは再訪の時間を
                確保しながら、残りの配送順を考え直さなければなりません。
              </p>
            </div>

            <div className="rounded-[36px] border border-orange-200 bg-white p-6 shadow-xl shadow-orange-950/5 sm:p-8">
              <div className="space-y-4">
                {[
                  ["09:37", "3件目へ到着", "受取人が不在"],
                  ["09:42", "連絡を試みる", "その場で待機"],
                  ["09:47", "不在票を作成", "後で再訪が必要"],
                  ["午後", "再び同じ地域へ", "移動時間が増加"],
                ].map(([time, title, detail], index) => (
                  <div className="flex gap-4" key={time}>
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex size-11 items-center justify-center rounded-2xl text-xs font-black ${
                          index === 2
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>

                      {index < 3 && (
                        <span className="h-9 border-l-2 border-dashed border-orange-200" />
                      )}
                    </div>

                    <div className="flex flex-1 items-start justify-between border-b border-orange-100 pb-4">
                      <div>
                        <p className="font-bold text-slate-950">{title}</p>
                        <p className="mt-1 text-sm text-slate-500">{detail}</p>
                      </div>

                      <p className="font-mono text-sm font-bold text-orange-600">
                        {time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-3xl bg-orange-50 p-5 text-center">
                <p className="text-sm font-bold text-orange-700">
                  移動・待機・再訪の負担が発生
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 解決策 */}
        <section className="relative overflow-hidden bg-[#071a33] text-white">
          <div className="absolute inset-0">
            <div className="route-grid absolute inset-0 opacity-10" />
            <div className="absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-24 sm:px-8">
            <SectionLabel light number="03">
              Our solution
            </SectionLabel>

            <div className="mt-10 text-center">
              <p className="text-sm font-bold tracking-[0.2em] text-cyan-300">
                SMART DELIVERY COMPASS
              </p>

              <h2 className="mx-auto mt-6 max-w-5xl text-4xl font-black leading-tight tracking-[-0.03em] sm:text-7xl">
                受取人とドライバーを、
                <br />
                <span className="text-cyan-300">リアルタイムにつなぐ。</span>
              </h2>
            </div>

            <div className="mx-auto mt-16 grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 text-center backdrop-blur">
                <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-cyan-300 text-3xl">
                  📱
                </span>
                <p className="mt-5 text-xs font-bold tracking-[0.18em] text-blue-200">
                  RECIPIENT
                </p>
                <h3 className="mt-2 text-xl font-bold">受取人</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  受取方法や戻り時間を
                  <br />
                  スマートフォンから送信
                </p>
              </div>

              <div className="flex items-center justify-center md:flex-col">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-cyan-300 md:h-20 md:w-px md:flex-none md:bg-gradient-to-b" />
                <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-2xl text-cyan-300">
                  ⇄
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-cyan-300 via-cyan-300 to-transparent md:h-20 md:w-px md:flex-none md:bg-gradient-to-b" />
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 text-center backdrop-blur">
                <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-blue-500 text-3xl">
                  🚚
                </span>
                <p className="mt-5 text-xs font-bold tracking-[0.18em] text-blue-200">
                  DRIVER
                </p>
                <h3 className="mt-2 text-xl font-bold">ドライバー</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  変更内容と新しい配送計画を
                  <br />
                  ドライバー画面で確認
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 1 */}
        <section className="bg-slate-50">
          <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-2">
            <div>
              <SectionLabel number="04">Step 1</SectionLabel>

              <p className="mt-8 text-sm font-black tracking-[0.2em] text-blue-600">
                RECIPIENT ACTION
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                受取人が、
                <br />
                受取方法を変更。
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                配達直前でも、対面受取から置き配へ変更できます。
                不在になる場合は、外出時間や戻り予定も登録できます。
              </p>

              <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-sm font-bold text-blue-800">
                  電話や複雑な手続きを必要とせず、スマートフォンから簡単に連絡
                </p>
              </div>
            </div>

            <RecipientPhone />
          </div>
        </section>

        {/* STEP 2 */}
        <section className="bg-white">
          <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="order-2 lg:order-1">
              <DriverScreen />
            </div>

            <div className="order-1 lg:order-2">
              <SectionLabel number="05">Step 2</SectionLabel>

              <p className="mt-8 text-sm font-black tracking-[0.2em] text-blue-600">
                REALTIME UPDATE
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                変更内容を、
                <br />
                すぐに共有。
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                受取人が送信した変更は、Supabase Realtimeを通じて
                ドライバー画面へリアルタイムに反映されます。
              </p>

              <div className="mt-8 flex items-center gap-4">
                <span className="relative flex size-4">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-4 rounded-full bg-emerald-500" />
                </span>

                <p className="text-sm font-bold text-emerald-700">
                  再読み込みをしなくても変更を確認
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3 */}
        <section className="bg-[#eff6ff]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <SectionLabel number="06">Step 3</SectionLabel>

            <div className="mt-8 max-w-4xl">
              <p className="text-sm font-black tracking-[0.2em] text-blue-600">
                ROUTE ADJUSTMENT
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                状況に合わせて、
                <br />
                配送計画を調整。
              </h2>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <article className="rounded-[36px] border border-blue-100 bg-white p-7 shadow-sm sm:p-9">
                <span className="inline-flex rounded-full bg-cyan-100 px-4 py-2 text-xs font-bold text-cyan-800">
                  置き配への変更
                </span>

                <h3 className="mt-6 text-2xl font-black text-slate-950">
                  配送順は変えない
                </h3>

                <p className="mt-4 leading-8 text-slate-600">
                  対面受取から置き配へ変わった場合は、現在の配送順を維持。
                  短縮された滞在時間だけ、後続地点の到着予定を前倒しします。
                </p>

                <div className="mt-8 rounded-3xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500">
                      対面受取
                    </span>
                    <span className="font-mono text-xl font-black text-slate-900">
                      5分
                    </span>
                  </div>

                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-blue-600">↓</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cyan-700">
                      置き配
                    </span>
                    <span className="font-mono text-xl font-black text-cyan-700">
                      10秒
                    </span>
                  </div>
                </div>
              </article>

              <article className="rounded-[36px] bg-[#071a33] p-7 text-white shadow-xl sm:p-9">
                <span className="inline-flex rounded-full bg-orange-400/15 px-4 py-2 text-xs font-bold text-orange-300">
                  不在・時間帯変更
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  残りのルートを再計算
                </h3>

                <p className="mt-4 leading-8 text-slate-300">
                  不在や配送時間帯の変更時は、受取人が戻る時間と
                  配送会社ごとの時間枠を考慮し、残りの配送順を組み直します。
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    "受取人の戻り予定",
                    "会社ごとの配送時間枠",
                    "現在地からの移動時間",
                  ].map((item) => (
                    <div
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                      key={item}
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-blue-500 text-xs font-black">
                        ✓
                      </span>
                      <p className="text-sm font-bold">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <SectionLabel number="07">Before and after</SectionLabel>

            <div className="mt-8 text-center">
              <h2 className="text-4xl font-black tracking-[-0.03em] sm:text-6xl">
                置き配への変更で、
                <br />
                後続の到着予定も早くなる。
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                3件目の滞在時間が5分から10秒へ短縮された場合、
                約4分50秒を後続の配送予定へ反映します。
              </p>
            </div>

            <div className="mt-14 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-7">
                <p className="text-xs font-bold tracking-[0.18em] text-slate-400">
                  BEFORE
                </p>
                <h3 className="mt-2 text-xl font-black">変更前</h3>

                <div className="mt-6 space-y-3">
                  {[
                    ["3件目", "対面受取・滞在5分", "10:30"],
                    ["4件目", "対面受取", "10:42"],
                    ["5件目", "対面受取", "10:58"],
                  ].map(([order, label, time]) => (
                    <div
                      className="flex items-center justify-between rounded-2xl bg-white p-4"
                      key={order}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-400">
                          {order}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {label}
                        </p>
                      </div>
                      <p className="font-mono text-lg font-black">{time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center text-4xl font-light text-blue-500">
                →
              </div>

              <div className="rounded-[32px] border-2 border-cyan-400 bg-cyan-50 p-7 shadow-xl shadow-cyan-950/5">
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-700">
                  AFTER
                </p>
                <h3 className="mt-2 text-xl font-black">変更後</h3>

                <div className="mt-6 space-y-3">
                  {[
                    ["3件目", "置き配・滞在10秒", "10:30"],
                    ["4件目", "4分50秒前倒し", "10:37"],
                    ["5件目", "4分50秒前倒し", "10:53"],
                  ].map(([order, label, time], index) => (
                    <div
                      className="flex items-center justify-between rounded-2xl bg-white p-4"
                      key={order}
                    >
                      <div>
                        <p className="text-xs font-bold text-cyan-700">
                          {order}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {label}
                        </p>
                      </div>
                      <p
                        className={`font-mono text-lg font-black ${
                          index > 0 ? "text-cyan-700" : ""
                        }`}
                      >
                        {time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-10 text-center text-2xl font-black text-blue-700 sm:text-3xl">
              約4分50秒の短縮を、後続の配送へ。
            </p>
          </div>
        </section>

        {/* 不在時 */}
        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-2">
            <div>
              <SectionLabel light number="08">
                Re-delivery
              </SectionLabel>

              <h2 className="mt-8 text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                不在をただ後回しにせず、
                <br />
                <span className="text-cyan-300">
                  戻れる時間を配送に活かす。
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                「30分後に戻る」という情報を、単なるメッセージではなく、
                次の配送計画を作るための条件として利用します。
              </p>
            </div>

            <div className="rounded-[36px] border border-white/10 bg-white/5 p-7 backdrop-blur sm:p-9">
              <div className="space-y-2">
                {[
                  {
                    number: "01",
                    title: "受取人が戻り時間を登録",
                    text: "「30分後に戻る」とスマートフォンから連絡",
                  },
                  {
                    number: "02",
                    title: "配送可能時刻を計算",
                    text: "戻り予定と指定された配送時間枠を確認",
                  },
                  {
                    number: "03",
                    title: "残りの順番を組み直す",
                    text: "その間に別の配送先を回れるルートを探索",
                  },
                  {
                    number: "04",
                    title: "在宅後に再訪",
                    text: "戻った後に配達できる予定へ自動調整",
                  },
                ].map((item, index) => (
                  <div className="flex gap-4" key={item.number}>
                    <div className="flex flex-col items-center">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-500 text-xs font-black">
                        {item.number}
                      </span>

                      {index < 3 && (
                        <span className="h-10 border-l border-dashed border-blue-300/40" />
                      )}
                    </div>

                    <div className="border-b border-white/10 pb-5">
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 価値 */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
            <SectionLabel number="09">Value</SectionLabel>

            <div className="mt-8 max-w-4xl">
              <h2 className="text-4xl font-black leading-tight tracking-[-0.03em] sm:text-6xl">
                配送に関わる全員へ、
                <br />
                より柔軟な選択肢を。
              </h2>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {values.map((value, index) => (
                <article
                  className={`rounded-[34px] p-7 sm:p-8 ${
                    index === 1
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-slate-50"
                  }`}
                  key={value.label}
                >
                  <p
                    className={`text-xs font-bold tracking-[0.2em] ${
                      index === 1 ? "text-blue-200" : "text-blue-600"
                    }`}
                  >
                    {value.label}
                  </p>

                  <h3 className="mt-7 text-2xl font-black">{value.title}</h3>

                  <p
                    className={`mt-4 leading-8 ${
                      index === 1 ? "text-blue-100" : "text-slate-600"
                    }`}
                  >
                    {value.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 最後 */}
        <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-[#071a33] text-white">
          <div className="absolute inset-0">
            <div className="route-grid absolute inset-0 opacity-15" />
            <div className="absolute left-1/2 top-1/2 size-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-5 py-24 text-center sm:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-cyan-300">
              SMART DELIVERY COMPASS
            </p>

            <h2 className="mx-auto mt-8 max-w-5xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-7xl">
              配送を、
              <br />
              受取人の予定に合わせて
              <br />
              <span className="text-cyan-300">変えられるものへ。</span>
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              受取人の予定変更と配送現場をリアルタイムにつなぎ、
              再配達を減らしながら柔軟な配送を実現します。
            </p>

            <div className="mx-auto mt-14 h-px max-w-xl bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />

            <p className="mt-8 text-xs leading-6 text-slate-400">
              Next.js · Supabase Realtime · MapLibre · OpenStreetMap · OSRM
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#071a33] text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Smart Delivery Compass in Hiroshima</p>
          <p>Presentation prototype</p>
        </div>
      </footer>
    </div>
  );
}
