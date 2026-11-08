export default function ProductCatalogSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-8">
      <aside
        aria-busy="true"
        aria-label="Loading product filters"
        className="min-h-96 animate-pulse rounded-xl bg-[#F1F0ED]"
      />
      <section
        aria-busy="true"
        aria-label="Loading products"
        className="min-w-0"
      >
        <div className="mb-5 h-10 animate-pulse rounded bg-[#F1F0ED]" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-[0.8/1] animate-pulse rounded-md bg-[#F1F0ED]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
