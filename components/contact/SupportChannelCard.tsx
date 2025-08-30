import {
  ArrowRight,
  ArrowUpRight,
  Github,
  HelpCircle,
  Linkedin,
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
  Github,
  Linkedin,
  Rss,
};

export function SupportChannelCard({
  title,
  description,
  buttonText,
  buttonLink,
  icon,
}: SupportChannelCardProps) {
  // Check if it's Twitter icon
  const isTwitterIcon = icon === 'Twitter';

  // Get the icon component or use HelpCircle as fallback
  const IconComponent = isTwitterIcon ? null : iconMap[icon] || HelpCircle;

  const isExternalLink =
    buttonLink.startsWith('http') || buttonLink.startsWith('mailto');

  return (
    <div className="flex h-full flex-col rounded-lg border p-5 transition-all hover:border-gray-400">
      <div className="space-y-3 pb-2">
        <div>
          {isTwitterIcon ? (
            <div className="relative h-5 w-5">
              <Image
                alt="Twitter/X"
                className="object-contain"
                height={20}
                src="/assets/social/twitter.svg"
                width={20}
              />
            </div>
          ) : (
            <IconComponent className="h-5 w-5 text-zinc-700" />
          )}
        </div>
        <h3 className="font-medium text-base text-zinc-900">{title}</h3>
      </div>
      <div className="flex-grow pb-6">
        <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
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
