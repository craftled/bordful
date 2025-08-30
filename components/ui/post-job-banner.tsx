import { Briefcase } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

export function PostJobBanner() {
  // Early return if banner is disabled
  if (!config.postJobBanner.enabled) {
    return null;
  }

  const {
    title,
    description,
    showTrustedBy,
    trustedByText,
    companyAvatars,
    cta,
    trustMessage,
  } = config.postJobBanner;

  return (
    <Card className="rounded-lg border p-6 shadow-none">
      <h3 className="mb-3 font-semibold text-lg">{title}</h3>
      <p className="mb-4 text-muted-foreground text-sm">{description}</p>

      {showTrustedBy && (
        <div className="mb-4 flex items-center gap-2">
          <div className="-space-x-3 flex">
            {companyAvatars.map((avatar, index) => (
              <Avatar className="h-7 w-7 border border-background" key={index}>
                <AvatarImage alt={avatar.alt} src={avatar.src} />
                <AvatarFallback>{avatar.fallback}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">{trustedByText}</span>
        </div>
      )}

      <a
        className="block"
        href={cta.link}
        rel={cta.external ? 'noopener noreferrer' : undefined}
        target={cta.external ? '_blank' : undefined}
      >
        <Button
          className="flex h-8 w-full items-center justify-center gap-1.5 px-3 text-xs sm:h-7 sm:px-2.5"
          size="xs"
          style={{ backgroundColor: resolveColor(config.ui.primaryColor) }}
          variant="primary"
        >
          <span className="flex items-center justify-center">
            {cta.text}
            <Briefcase aria-hidden="true" className="ml-1 h-3.5 w-3.5" />
          </span>
        </Button>
      </a>

      <p className="mt-4 text-center text-muted-foreground text-xs">
        {trustMessage}
      </p>
    </Card>
  );
}
