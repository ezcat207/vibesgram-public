interface FAQ {
  question: string;
  answer: string;
}

interface FAQProps {
  title: string;
  subtitle: string;
  faqs: FAQ[];
}

export function FAQ({ title, subtitle, faqs }: FAQProps) {
  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* FAQ List */}
        <div className="mx-auto max-w-2xl divide-y divide-border">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group py-3"
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between py-2 font-medium">
                <span className="pr-8 text-base transition-all duration-200 group-hover:underline">
                  {faq.question}
                </span>
                <span className="shrink-0 transition-transform duration-200 group-open:rotate-180">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </summary>
              <div className="pt-2">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
