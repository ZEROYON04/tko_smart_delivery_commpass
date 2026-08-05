"use client";

import Image from "next/image";
import { useEffect, type ReactNode } from "react";

const problems = [
  {
    number: "01",
    title: "予定は、配達直前にも変わる",
    text: "在宅するつもりでも、急な外出や予定変更が発生することがあります。",
  },
  {
    number: "02",
    title: "変更をすぐ伝えにくい",
    text: "受取方法や短時間の不在予定を、配送現場へすぐ共有できない場合があります。",
  },
  {
    number: "03",
    title: "現地で不在が判明する",
    text: "訪問後に不在を知ると、待機や後からの再訪が必要になります。",
  },
];

const lineFeatures = [
  {
    label: "STATUS",
    title: "配達状況を確認",
    text: "当日の配送予定や、あと何件・約何分かをLINEから確認します。",
  },
  {
    label: "CHANGE",
    title: "受取予定を連絡",
    text: "「今日は受け取れない」「10分不在」「30分不在」をLINEから送信します。",
  },
  {
    label: "SHARE",
    title: "ドライバーへ反映",
    text: "受取人から届いた変更内容を、ドライバー画面へリアルタイムに反映します。",
  },
];

const technologies = [
  "Next.js",
  "Supabase Realtime",
  "LINE Messaging API",
  "MapLibre",
  "OpenStreetMap",
  "OSRM",
];

function useLandingMotion() {
  useEffect(() => {
    const revealTargets =
      document.querySelectorAll<HTMLElement>("[data-reveal]");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    revealTargets.forEach((target) => revealObserver.observe(target));

    const updateProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(Math.min(Math.max(progress, 0), 1)),
      );
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);
}

function SectionTag({
  number,
  children,
  dark = false,
}: {
  number: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 text-[11px] font-black tracking-[0.24em] ${
        dark ? "text-cyan-200" : "text-blue-700"
      }`}
    >
      <span
        className={`h-px w-10 ${
          dark ? "bg-cyan-300/60" : "bg-blue-600/40"
        }`}
      />
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

function WordMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="relative flex size-10 items-center justify-center rounded-2xl bg-cyan-300 text-[#071a33] shadow-lg shadow-cyan-400/20">
        <svg
          aria-hidden="true"
          className="size-6"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 16.5C8.8 12.2 11.9 10.9 18.8 7.3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.2"
          />
          <circle cx="5" cy="16.5" r="2.2" fill="currentColor" />
          <circle cx="18.8" cy="7.3" r="2.2" fill="currentColor" />
        </svg>
      </span>

      <span>
        <span className="block text-[10px] font-black tracking-[0.18em] text-cyan-200">
          SMART DELIVERY
        </span>
        <span className="mt-0.5 block text-sm font-black text-white">
          スマート配送コンパス
        </span>
      </span>
    </div>
  );
}

function SideNavigation() {
  const items = [
    ["01", "CONCEPT"],
    ["02", "PROBLEM"],
    ["03", "FEATURE"],
    ["04", "LOGIC"],
  ];

  return (
    <nav
      aria-label="ページ内ナビゲーション"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <ol className="space-y-3">
        {items.map(([number, label], index) => (
          <li key={number}>
            <a
              aria-label={`${number} ${label}へ移動`}
              className="group flex items-center justify-end gap-3"
              href={`#section-${index + 1}`}
            >
              <span className="translate-x-2 text-[9px] font-black tracking-[0.16em] text-slate-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                {label}
              </span>
              <span className="flex size-9 items-center justify-center rounded-full border border-slate-300/60 bg-white/80 text-[10px] font-black text-slate-700 shadow-sm backdrop-blur transition group-hover:border-cyan-400 group-hover:bg-cyan-300 group-hover:text-[#071a33]">
                {number}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function DecorativeRoute() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 760 620"
      preserveAspectRatio="none"
    >
      <path
        className="route-line route-line-back"
        d="M-40 500C80 465 112 323 230 338C365 356 381 145 520 176C625 199 641 274 801 202"
      />
      <path
        className="route-line route-line-front"
        d="M-40 500C80 465 112 323 230 338C365 356 381 145 520 176C625 199 641 274 801 202"
      />
      <circle className="route-point route-point-1" cx="230" cy="338" r="8" />
      <circle className="route-point route-point-2" cx="520" cy="176" r="8" />
      <circle className="route-point route-point-3" cx="720" cy="236" r="8" />
    </svg>
  );
}

function ScreenshotPhone({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[34px] border-[7px] border-[#07101f] bg-[#07101f] p-1 shadow-[0_30px_80px_rgba(2,12,27,0.28)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={760}
        height={1654}
        priority={priority}
        sizes="(max-width: 640px) 76vw, 300px"
        className="h-auto w-full rounded-[24px]"
      />
    </div>
  );
}

function HeroVisual() {
  return (
    <div
      className="relative mx-auto min-h-[530px] w-full max-w-[570px] sm:min-h-[610px]"
      data-reveal
    >
      <div className="absolute inset-x-[8%] top-[9%] h-[72%] rotate-3 rounded-[48px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm" />
      <div className="absolute inset-x-[15%] top-[4%] h-[72%] -rotate-3 rounded-[48px] bg-gradient-to-br from-cyan-300/20 to-blue-500/10 blur-[1px]" />

      <ScreenshotPhone
        src="/screenshots/line-delivery-menu.webp"
        alt="LINEに表示された当日の配送予定と配達状況確認メニュー"
        priority
        className="motion-float absolute left-[8%] top-[2%] z-10 w-[46%] -rotate-[6deg]"
      />

      <div className="motion-float-delayed absolute right-[1%] top-[21%] z-20 w-[56%] rounded-[28px] border border-white/15 bg-white/95 p-5 text-[#071a33] shadow-[0_30px_80px_rgba(0,0,0,0.26)] sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black tracking-[0.18em] text-blue-600">
            CHANGE RECEIVED
          </p>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-black text-emerald-700">
            REALTIME
          </span>
        </div>

        <p className="mt-5 text-xl font-black leading-tight sm:text-2xl">
          「10分ほど不在」
          <br />
          をドライバーへ共有
        </p>

        <div className="mt-5 rounded-2xl bg-slate-100 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-300 font-black">
              4
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black">次の配送地点</p>
              <p className="mt-1 text-[10px] text-slate-500">
                在宅予定と配送枠を確認
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          配送計画へ反映
          <span className="h-px flex-1 bg-slate-200" />
        </div>
      </div>

      <div className="motion-float absolute bottom-[8%] left-[3%] z-30 rounded-full border border-cyan-200/40 bg-[#071a33]/85 px-4 py-3 text-xs font-black text-cyan-200 shadow-xl backdrop-blur">
        予定変更を、次のルートへ
      </div>

      <div className="motion-spin-slow absolute bottom-[9%] right-[9%] z-30 flex size-24 items-center justify-center rounded-full bg-orange-400 text-center text-[10px] font-black leading-4 text-orange-950 shadow-xl sm:size-28">
        PROTOTYPE
        <br />
        DEMO
      </div>
    </div>
  );
}

function ProblemCard({
  number,
  title,
  text,
  delay,
}: {
  number: string;
  title: string;
  text: string;
  delay: number;
}) {
  return (
    <article
      className="reveal-card group relative overflow-hidden rounded-[30px] border border-orange-100 bg-white p-6 shadow-[0_18px_60px_rgba(104,70,22,0.08)] sm:p-7"
      data-reveal
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute -right-5 -top-8 text-[118px] font-black leading-none text-orange-50 transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2">
        {number}
      </div>

      <div className="relative">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-xs font-black text-orange-700">
          {number}
        </span>
        <h3 className="mt-8 text-xl font-black leading-snug text-[#162033]">
          {title}
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">{text}</p>
      </div>
    </article>
  );
}

function LineFeatureCard({
  label,
  title,
  text,
  index,
}: {
  label: string;
  title: string;
  text: string;
  index: number;
}) {
  return (
    <article
      className="group rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_16px_55px_rgba(15,54,110,0.08)] transition-transform duration-300 hover:-translate-y-1"
      data-reveal
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <p className="text-[9px] font-black tracking-[0.18em] text-cyan-600">
            {label}
          </p>
          <h3 className="mt-1 text-lg font-black text-[#071a33]">{title}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{text}</p>
    </article>
  );
}

function ScenarioCard({
  tone,
  label,
  title,
  description,
  children,
}: {
  tone: "cyan" | "orange";
  label: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const cyan = tone === "cyan";

  return (
    <article
      className={`relative overflow-hidden rounded-[36px] border p-7 backdrop-blur sm:p-9 ${
        cyan
          ? "border-cyan-200/20 bg-cyan-300/[0.07]"
          : "border-orange-200/20 bg-orange-300/[0.07]"
      }`}
      data-reveal
    >
      <div
        className={`absolute -right-20 -top-20 size-56 rounded-full blur-3xl ${
          cyan ? "bg-cyan-300/10" : "bg-orange-300/10"
        }`}
      />

      <div className="relative">
        <span
          className={`inline-flex rounded-full px-4 py-2 text-[10px] font-black tracking-[0.14em] ${
            cyan
              ? "bg-cyan-300/15 text-cyan-200"
              : "bg-orange-300/15 text-orange-200"
          }`}
        >
          {label}
        </span>

        <h3 className="mt-6 text-2xl font-black sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-xl leading-8 text-slate-300">{description}</p>
        {children}
      </div>
    </article>
  );
}

export default function Home() {
  useLandingMotion();

  return (
    <main className="overflow-x-hidden bg-white text-[#071a33]">
      <div aria-hidden="true" className="scroll-progress" />
      <SideNavigation />

      {/* 01 CONCEPT */}
      <section
        id="section-1"
        className="hero-section relative flex min-h-[100svh] items-center overflow-hidden bg-[#071a33] px-5 pb-20 pt-8 text-white sm:px-8 lg:py-16"
      >
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -left-40 -top-48 size-[560px] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-64 right-[8%] size-[620px] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="hero-grid absolute inset-0 opacity-[0.08]" />
          <DecorativeRoute />
        </div>

        <div className="relative mx-auto w-full max-w-7xl">
          <header className="flex items-center justify-between">
            <WordMark />
            <p className="hidden text-[10px] font-black tracking-[0.2em] text-blue-200 sm:block">
              HIROSHIMA / DELIVERY SUPPORT PROTOTYPE
            </p>
          </header>

          <div className="grid items-center gap-10 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:pt-5">
            <div className="relative z-20" data-reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black tracking-[0.12em] text-cyan-200">
                <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_18px_#67e8f9]" />
                配送支援システム・動作確認モック
              </div>

              <p className="mt-7 text-[11px] font-black tracking-[0.28em] text-blue-200">
                SMART DELIVERY COMPASS
              </p>

              <h1 className="mt-4 text-[clamp(3.2rem,8vw,7.4rem)] font-black leading-[0.94] tracking-[-0.065em]">
                予定が
                <br />
                <span className="text-cyan-300">変わっても、</span>
                <br />
                配送を止めない。
              </h1>

              <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-slate-300 sm:text-lg sm:leading-9">
                受取人の予定変更をドライバーへ共有し、
                変更内容に応じて到着予定や残りの配送順を再計算する
                配送支援システムです。
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {["LINEで連絡", "Realtime共有", "ETA再計算"].map((item) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black text-slate-200"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroVisual />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-y border-white/10 bg-white/[0.04] py-3 backdrop-blur">
          <div className="marquee-track whitespace-nowrap text-[10px] font-black tracking-[0.22em] text-cyan-100/70">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <span key={groupIndex}>
                SMART DELIVERY COMPASS&nbsp;&nbsp;●&nbsp;&nbsp;CHANGE THE
                PLAN, NOT THE PROMISE&nbsp;&nbsp;●&nbsp;&nbsp;HIROSHIMA
                PROTOTYPE&nbsp;&nbsp;●&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 02 PROBLEM */}
      <section
        id="section-2"
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#fff8ec] px-5 py-24 sm:px-8 lg:py-28"
      >
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -right-40 top-10 size-[480px] rounded-full bg-orange-200/40 blur-3xl" />
          <p className="absolute -left-6 top-1/2 -translate-y-1/2 rotate-90 text-[120px] font-black tracking-[-0.08em] text-orange-950/[0.035] sm:text-[180px]">
            WHY?
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div data-reveal>
              <SectionTag number="02">BACKGROUND / PROBLEM</SectionTag>

              <p className="mt-9 text-xs font-black tracking-[0.18em] text-orange-600">
                こんな経験、ありませんか？
              </p>

              <h2 className="mt-4 text-[clamp(2.7rem,6vw,5.5rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#172033]">
                受取人の変更が、
                <br />
                <span className="relative inline-block text-orange-600">
                  配送計画に届かない。
                  <span className="absolute bottom-0 left-0 h-3 w-full -rotate-1 bg-orange-300/35" />
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                急な予定変更そのものをなくすことはできません。
                だからこそ、変更を早く共有し、次の配送判断へつなげる仕組みが必要です。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {problems.map((problem, index) => (
                <ProblemCard
                  key={problem.number}
                  {...problem}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>

          <div
            className="relative mt-14 overflow-hidden rounded-[38px] bg-[#071a33] p-7 text-white shadow-[0_30px_90px_rgba(25,36,55,0.2)] sm:p-10 lg:p-12"
            data-reveal
          >
            <div className="absolute -right-10 -top-16 size-60 rounded-full border-[34px] border-cyan-300/10" />
            <div className="absolute bottom-5 right-[22%] size-5 rounded-full bg-orange-400" />

            <div className="relative grid gap-7 lg:grid-cols-[0.28fr_0.72fr] lg:items-center">
              <div>
                <p className="text-[10px] font-black tracking-[0.22em] text-cyan-300">
                  OUR QUESTION
                </p>
                <p className="mt-3 text-sm font-bold text-blue-200">
                  私たちが考えたこと
                </p>
              </div>

              <p className="text-2xl font-black leading-relaxed sm:text-4xl lg:text-5xl">
                予定変更を、
                <br className="sm:hidden" />
                単なる連絡で終わらせず、
                <br />
                <span className="text-cyan-300">
                  次の配送計画に活用できないか。
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 FEATURE */}
      <section
        id="section-3"
        className="relative min-h-[100svh] overflow-hidden bg-[#eef8ff] px-5 py-24 sm:px-8 lg:py-28"
      >
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -left-32 top-1/3 size-[430px] rounded-full bg-cyan-200/35 blur-3xl" />
          <div className="absolute right-[-8%] top-12 size-[480px] rounded-full border-[70px] border-blue-600/[0.035]" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-20" data-reveal>
              <SectionTag number="03">LINE / REALTIME</SectionTag>

              <h2 className="mt-8 text-[clamp(2.7rem,5vw,5rem)] font-black leading-[1.04] tracking-[-0.055em]">
                いつものLINEから、
                <br />
                <span className="text-blue-600">配送現場へつなぐ。</span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                受取人はLINEから配送状況を確認し、当日の受取不可や短時間の不在予定を連絡できます。
                変更内容はドライバー画面へ反映されます。
              </p>

              <div className="mt-8 space-y-4">
                {lineFeatures.map((feature, index) => (
                  <LineFeatureCard
                    key={feature.title}
                    {...feature}
                    index={index}
                  />
                ))}
              </div>

              <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-[10px] font-black text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-500" />
                LINE連携モックで動作確認
              </div>
            </div>

            <div className="relative min-h-[830px] sm:min-h-[900px] lg:min-h-[970px]">
              <div
                className="absolute left-0 top-4 z-10 w-[58%] max-w-[330px]"
                data-reveal
              >
                <ScreenshotPhone
                  src="/screenshots/line-delivery-menu.webp"
                  alt="LINEに表示された配送予定と配達状況確認メニュー"
                  className="-rotate-[4deg]"
                />
                <p className="mt-5 text-center text-xs font-black text-slate-600">
                  01　配送予定を確認
                </p>
              </div>

              <div
                className="absolute right-0 top-[280px] z-20 w-[60%] max-w-[340px] sm:top-[260px]"
                data-reveal
                style={{ transitionDelay: "140ms" }}
              >
                <ScreenshotPhone
                  src="/screenshots/line-realtime.webp"
                  alt="LINEから受取不可や短時間の不在予定を共有する画面"
                  className="rotate-[4deg]"
                />
                <p className="mt-5 text-center text-xs font-black text-slate-600">
                  02　予定変更を送信
                </p>
              </div>

              <div className="absolute left-[8%] top-[58%] z-30 rounded-[26px] border border-blue-100 bg-white p-5 shadow-[0_20px_70px_rgba(18,64,118,0.16)] sm:left-[2%] sm:w-[280px]">
                <p className="text-[9px] font-black tracking-[0.2em] text-blue-600">
                  RECIPIENT → DRIVER
                </p>
                <p className="mt-3 text-lg font-black leading-snug">
                  受取人の一言を、
                  <br />
                  配送判断に使える情報へ。
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-300 font-black">
                    ✓
                  </span>
                  <p className="text-xs font-bold leading-5 text-slate-600">
                    Supabase Realtimeを通じて
                    <br />
                    ドライバー画面へ反映
                  </p>
                </div>
              </div>

              <div className="motion-spin-slow absolute bottom-[7%] right-[12%] z-30 flex size-24 items-center justify-center rounded-full bg-blue-600 text-center text-[10px] font-black leading-4 text-white shadow-xl">
                ACTUAL
                <br />
                DEMO UI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04 LOGIC */}
      <section
        id="section-4"
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#071a33] px-5 py-24 text-white sm:px-8 lg:py-28"
      >
        <div aria-hidden="true" className="absolute inset-0">
          <div className="hero-grid absolute inset-0 opacity-[0.055]" />
          <div className="absolute left-1/2 top-1/2 size-[740px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div data-reveal>
              <SectionTag number="04" dark>
                ROUTE ADJUSTMENT
              </SectionTag>

              <h2 className="mt-8 text-[clamp(2.8rem,6vw,5.7rem)] font-black leading-[1.02] tracking-[-0.055em]">
                変更の種類で、
                <br />
                <span className="text-cyan-300">計算のしかたを変える。</span>
              </h2>
            </div>

            <p
              className="max-w-md text-sm leading-7 text-slate-400 lg:pb-2"
              data-reveal
            >
              すべての変更で配送順を組み直すのではなく、
              必要な場合だけ残りの順番を再計算します。
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 lg:grid-cols-2">
            <ScenarioCard
              tone="cyan"
              label="CASE 01 / 受取方法の変更"
              title="配送順はそのまま"
              description="対面受取から置き配への変更では、配送順を固定したまま、短縮された滞在時間を後続地点の到着予定へ反映します。"
            >
              <div className="mt-8 rounded-[28px] border border-white/10 bg-black/15 p-5 sm:p-6">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400">
                      対面受取
                    </p>
                    <p className="mt-2 text-3xl font-black">300秒</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-2xl text-cyan-300">→</span>
                    <span className="mt-1 text-[9px] font-black text-cyan-200">
                      METHOD CHANGE
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-cyan-200">
                      置き配
                    </p>
                    <p className="mt-2 text-3xl font-black text-cyan-300">
                      10秒
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-cyan-300/10 px-4 py-3 text-center text-xs font-black text-cyan-200">
                  配送順を変えず、後続ETAのみ再計算
                </div>
              </div>
            </ScenarioCard>

            <ScenarioCard
              tone="orange"
              label="CASE 02 / 不在・時間帯変更"
              title="残りの配送順を再計算"
              description="不在予定や配送日の変更では、在宅予定と配送時間枠を守れるように、残りの配送順と到着予定を再計算します。"
            >
              <div className="mt-8 space-y-3">
                {[
                  ["戻り予定", "受取人があと何分で戻るか"],
                  ["配送枠", "配送会社ごとの時間帯"],
                  ["移動時間", "現在地から各配送地点まで"],
                ].map(([title, text], index) => (
                  <div
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                    key={title}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-400 text-xs font-black text-orange-950">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-black">{title}</p>
                      <p className="mt-1 text-xs text-slate-400">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScenarioCard>

            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-px w-20 -translate-x-1/2 -translate-y-1/2 lg:block">
              <span className="absolute inset-0 border-t-2 border-dashed border-white/20" />
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-cyan-300 text-[10px] font-black text-[#071a33]">
                +
              </span>
            </div>
          </div>

          <div
            className="mt-10 grid gap-8 border-t border-white/10 pt-9 lg:grid-cols-[1.2fr_0.8fr] lg:items-end"
            data-reveal
          >
            <div>
              <p className="text-[10px] font-black tracking-[0.22em] text-cyan-300">
                OUR GOAL
              </p>
              <p className="mt-4 text-2xl font-black leading-relaxed sm:text-4xl">
                予定変更を配送計画へ取り込み、
                <br />
                <span className="text-cyan-300">
                  不在や再訪の発生を抑えることを目指す。
                </span>
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black tracking-[0.16em] text-slate-500">
                PROTOTYPE TECHNOLOGIES
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {technologies.map((technology) => (
                  <span
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black text-slate-300"
                    key={technology}
                  >
                    {technology}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-[9px] leading-5 text-slate-500">
                配送会社システム、ドライバー認証、Amazon Location
                Serviceには接続していない動作確認モックです。地図表示にはMapLibre
                GLとOpenStreetMap、経路計算にはOSRMの公開デモサービスを使用しています。
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/10 px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
            <WordMark />
            <p className="text-right text-[9px] font-black tracking-[0.16em] text-slate-500">
              CHANGE THE PLAN,
              <br className="sm:hidden" />
              NOT THE PROMISE.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
