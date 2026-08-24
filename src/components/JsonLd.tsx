// Renders one or more JSON-LD nodes into the page. Server component — the
// markup ships in the static HTML so crawlers and answer engines see it
// without executing JS.

export function JsonLd({ data }: { data: object | object[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Structured data is generated from our own catalog, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
