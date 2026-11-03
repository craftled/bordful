import { MarketingImage } from "./marketing-image";
import { SOCIAL_LINKS } from "./site";

export function SocialIconLinks({
  className,
  exclude = [],
}: {
  className?: string;
  exclude?: readonly string[];
}) {
  return (
    <ul className={className}>
      {SOCIAL_LINKS.filter((link) => !exclude.includes(link.href)).map(
        (link) => (
          <li key={link.href}>
            <a
              aria-label={link.name}
              className="focus-visible:outline-ring inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <MarketingImage
                alt=""
                className="marketing-mono h-4 w-4 opacity-80 hover:opacity-100"
                height={16}
                src={link.icon}
                width={16}
              />
            </a>
          </li>
        )
      )}
    </ul>
  );
}
