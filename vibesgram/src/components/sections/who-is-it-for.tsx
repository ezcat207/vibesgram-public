interface Group {
  icon: string;
  title: string;
  description: string;
}

interface WhoIsItForProps {
  title: string;
  subtitle: string;
  groups: Group[];
  cta?: React.ReactNode;
}

export function WhoIsItFor({ title, subtitle, groups, cta }: WhoIsItForProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* User Groups Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.title}
              className="flex flex-col items-start space-y-3 rounded-lg bg-muted/50 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
                {group.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {group.title}
              </h3>
              <p className="text-muted-foreground">{group.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {cta && <div className="mt-12 text-center">{cta}</div>}
      </div>
    </section>
  );
}
