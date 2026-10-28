export function Ticker({ items }: { items: readonly string[] }) {
  return (
    <div className="overflow-hidden border-t-4 border-ink bg-panel2 py-2" aria-hidden="true">
      <div className="animate-ticker flex w-max whitespace-nowrap">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex min-w-[100vw] shrink-0 items-center justify-around font-pixel text-[10px] text-yellow">
            {[0, 1, 2, 3].flatMap((repeat) => items.map((item, index) => (
              <span key={`${repeat}-${index}`} className="mx-6">{item} ◆</span>
            )))}
          </div>
        ))}
      </div>
    </div>
  );
}
