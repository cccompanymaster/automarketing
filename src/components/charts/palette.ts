// Chart colors. Validated with the dataviz six-checks script on the site's
// white card surface (#ffffff, light mode, --pairs all): lightness band,
// chroma floor, CVD separation (worst ΔE 8.1), normal-vision floor (≥ 20.5)
// and ≥ 3:1 contrast all pass. Charts use at most these three series; a
// fourth would put two too-similar hues on screen — fold it into "기타".
//
//   node <dataviz>/scripts/validate_palette.js "#047857,#2a78d6,#eb6834" --mode light --surface "#ffffff" --pairs all

/** Categorical series, fixed order: brand green, blue, orange. */
export const SERIES = ["#047857", "#2a78d6", "#eb6834"] as const;
/** De-emphasis (the bars that are context, not the story). */
export const DEEMPH = "#94a3b8";
/** Hairline gridlines and the baseline. */
export const GRID = "#e2e8f0";
export const BASELINE = "#cbd5e1";

export const seriesColor = (i: number) => SERIES[Math.min(i, SERIES.length - 1)];
