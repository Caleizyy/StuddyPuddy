export function ComingSoonPage({ title }: { title: string }) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">This page is coming soon.</p>
    </main>
  );
}
