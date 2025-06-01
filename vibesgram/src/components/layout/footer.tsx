import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
}

interface FooterProps {
  title: string;
  description: string;
  contact: {
    email: string;
  };
  sections: FooterSection[];
  socialLinks: SocialLink[];
  disclaimer?: {
    poweredBy?: string;
    note?: string;
  };
}

export function Footer({
  title,
  description,
  contact,
  sections,
  socialLinks,
  disclaimer,
}: FooterProps) {
  return (
    <footer className="bg-background/95 border-t">
      <div className="container mx-auto">
        <div className="grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/icon.png" alt="Logo" width={32} height={32} />
              <span className="text-lg font-bold">{title}</span>
            </Link>
            <p className="text-muted-foreground text-sm">{description}</p>
            <Link
              href={`mailto:${contact.email}`}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {contact.email}
            </Link>
          </div>

          {/* Links */}
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col space-y-4">
                <h3 className="text-sm font-medium">{section.title}</h3>
                <div className="flex flex-col space-y-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright and Disclaimer */}
        <div className="flex flex-col justify-between space-y-4 border-t py-6">
          <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {title} All rights reserved.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((link) => (
                <Link
                  key={link.platform}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {link.platform}
                </Link>
              ))}
            </div>
          </div>

          {/* Disclaimer Section */}
          {disclaimer && (
            <div className="text-muted-foreground mt-4 text-center text-sm">
              {disclaimer.poweredBy && <p>{disclaimer.poweredBy}</p>}
              {disclaimer.note && <p className="mt-2">{disclaimer.note}</p>}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
