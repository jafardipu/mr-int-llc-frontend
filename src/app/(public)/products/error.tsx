"use client";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center"
    >
      <h2 className="text-lg font-semibold text-[#24231F]">
        Products could not be loaded
      </h2>
      <p className="mt-2 text-sm text-[#77766F]">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-md bg-secondary-color px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </section>
  );
}
