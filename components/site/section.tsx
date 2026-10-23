/** Standard page container so every page shares gutters and max width. */
export function Page({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto w-full space-y-12 px-6 py-14 ${narrow ? "max-w-3xl" : "max-w-6xl"}`}>{children}</div>;
}
