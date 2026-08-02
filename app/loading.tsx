export default function Loading() {
  return (
    <div className="page" aria-busy="true" aria-live="polite">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-14 max-w-2xl" />
      <div className="skeleton mt-3 h-5 max-w-xl" />
      <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.65fr)]"><div className="skeleton h-[390px]" /><div className="skeleton h-[390px]" /></div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2"><div className="skeleton h-[330px]" /><div className="skeleton h-[330px]" /></div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
