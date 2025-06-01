import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  image: string;
  bulletPoints?: string[];
  cta?: React.ReactNode;
}

interface FeaturesProps {
  title: string;
  features: Feature[];
}

export function Features({ title, features }: FeaturesProps) {
  return (
    <section className="py-12">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="space-y-20">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "grid items-center gap-8 md:grid-cols-2 md:gap-12",
                index % 2 === 1 && "md:grid-flow-dense",
              )}
            >
              {/* Image */}
              <div
                className={cn(
                  "relative flex min-h-[300px] w-full items-center justify-center",
                  index % 2 === 1 && "md:col-start-2",
                )}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="rounded-lg object-contain"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-lg text-muted-foreground">
                  {feature.description}
                </p>
                {feature.bulletPoints && (
                  <ul className="space-y-2">
                    {feature.bulletPoints.map((point) => (
                      <li key={point} className="flex items-center space-x-2">
                        <span className="text-primary">✓</span>
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {feature.cta && <div className="pt-4">{feature.cta}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
