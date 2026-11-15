import {
  ArrowRight,
  ArrowUpRight,
  HelpCircle,
  type LucideIcon,
  Mail,
  MessageSquare,
  Phone,
  Rss,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

type SupportChannelCardProps = {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  icon: string;
};

// Map of icon names to components
const iconMap: Record<string, LucideIcon> = {
  Mail,
  HelpCircle,
  Phone,
  MessageSquare,
  Rss,
};

// lucide-react 1.x dropped brand icons, so brands use the bundled SVGs.
const brandIcons: Record<string, { alt: string; src: string }> = {
  Twitter: { alt: 'Twitter/X', src: '/assets/social/twitter.svg' },
  Github: { alt: 'GitHub', src: '/assets/social/github.svg' },
  Linkedin: { alt: 'LinkedIn', src: '/assets/social/linkedin.svg' },
};

export function SupportChannelCard({
  title,
  description,
  buttonText,
  buttonLink,
  icon,
}: SupportChannelCardProps) {
  const brandIcon = brandIcons[icon];
  const IconComponent = iconMap[icon] ?? HelpCircle;

  const isExternalLink =
    buttonLink.startsWith('http') || buttonLink.startsWith('mailto');

  return (
    <div className="flex h-full flex-col rounded-lg border p-5 transition-all hover:border-gray-400">
      <div className="space-y-3 pb-2">
        <div>
          {brandIcon ? (
            <div className="relative h-5 w-5">
              <Image
                alt={brandIcon.alt}
                className="object-contain"
                height={20}
                src={brandIcon.src}
                width={20}
              />
            </div>
          ) : (
            <IconComponent className="h-5 w-5 text-zinc-700" />
          )}
        </div>
        <h3 className="text-base font-medium text-zinc-900">{title}</h3>
      </div>
      <div className="flex-grow pb-6">
        <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
      </div>
      <div className="mt-auto pt-0">
        <Button
          asChild
          className="w-full gap-1.5 text-xs"
          size="xs"
          style={{ backgroundColor: resolveColor(config.ui.primaryColor) }}
          variant="primary"
        >
          <Link
            href={buttonLink}
            rel={isExternalLink ? 'noopener noreferrer' : undefined}
            target={isExternalLink ? '_blank' : undefined}
          >
            {buttonText}
            {isExternalLink && (
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {!isExternalLink && (
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </Link>
        </Button>
      </div>
    </div>
  );
}
