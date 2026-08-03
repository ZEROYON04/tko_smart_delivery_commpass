export function LoadingState({
  label = "読み込んでいます",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <span className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
