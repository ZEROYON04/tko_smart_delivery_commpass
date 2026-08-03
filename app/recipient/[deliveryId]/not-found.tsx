import Link from "next/link";

export default function RecipientNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
          ?
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          荷物が見つかりません
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          URLが正しいか確認してください。デモデータをリセットした場合は、READMEに記載された固定IDを使用できます。
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          href="/"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
