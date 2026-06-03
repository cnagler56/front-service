/**
 * /cornyield embeds the USDA NASS corn planting county map. Static iframe
 * wrapper with a small header bar — no app state.
 */
export default function CornYieldPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-4 py-2 bg-green-800 text-white">
        <h1 className="text-lg font-semibold">Corn Planting Map — USDA NASS</h1>
        <a
          href="https://www.nass.usda.gov/Charts_and_Maps/Crops_County/cr-pl.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline opacity-80 hover:opacity-100"
        >
          Open on USDA NASS ↗
        </a>
      </div>
      <iframe
        src="https://www.nass.usda.gov/Charts_and_Maps/Crops_County/cr-pl.php"
        className="flex-1 w-full border-0"
        title="USDA NASS Corn Planting County Map"
      />
    </div>
  );
}
