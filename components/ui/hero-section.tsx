import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import config from '@/config';
import { cn } from '@/lib/utils';

type HeroImageConfig = {
  enabled?: boolean;
  src?: string;
  alt?: string;
};

type HeroBackgroundImageOverlay = {
  enabled?: boolean;
  color?: string;
  opacity?: number;
};

type HeroBackgroundImageConfig = {
  enabled?: boolean;
  src?: string;
  position?: string;
  size?: string;
  overlay?: HeroBackgroundImageOverlay;
};

type HeroSectionProps = {
  badge: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  heroImage?: HeroImageConfig; // Add per-page hero image configuration
};

export function HeroSection({
  badge,
  title,
  description,
  children,
  heroImage,
}: HeroSectionProps) {
  // Get the hero background color from config if available
  const heroBackgroundColor = config?.ui?.heroBackgroundColor || '';
  const heroTitleColor = config?.ui?.heroTitleColor || '';
  const heroSubtitleColor = config?.ui?.heroSubtitleColor || '';
  const heroBadgeVariant = config?.ui?.heroBadgeVariant || 'outline';
  const heroBadgeBgColor = config?.ui?.heroBadgeBgColor || '';
  const heroBadgeTextColor = config?.ui?.heroBadgeTextColor || '';
  const heroBadgeBorderColor = config?.ui?.heroBadgeBorderColor || '';
  const heroGradient = config?.ui?.heroGradient;
  const heroBackgroundImage = config?.ui
    ?.heroBackgroundImage as HeroBackgroundImageConfig;

  // Use page-specific hero image config if provided, otherwise fall back to global config
  const heroImageConfig = heroImage || config?.ui?.heroImage;

  // Create background style based on image, gradient, or solid color (in order of precedence)
  let heroStyle: React.CSSProperties = {};
  let overlayStyle: React.CSSProperties = {};
  let hasOverlay = false;

  // Image background takes precedence over gradient and solid color
  if (heroBackgroundImage?.enabled && heroBackgroundImage.src) {
    heroStyle = {
      backgroundImage: `url(${heroBackgroundImage.src})`,
      backgroundPosition: heroBackgroundImage.position || 'center',
      backgroundSize: heroBackgroundImage.size || 'cover',
      backgroundRepeat: 'no-repeat',
      position: 'relative', // Required for overlay positioning
    };

    // Add overlay if enabled
    if (
      heroBackgroundImage.overlay?.enabled &&
      heroBackgroundImage.overlay.color
    ) {
      hasOverlay = true;
      overlayStyle = {
        backgroundColor: heroBackgroundImage.overlay.color,
        opacity:
          heroBackgroundImage.overlay.opacity !== undefined
            ? heroBackgroundImage.overlay.opacity
            : 0.7,
      };
    }
  }
  // Gradient takes precedence over solid color if image is not enabled
  else if (heroGradient?.enabled && heroGradient.colors?.length) {
    const { type, direction, colors, stops } = heroGradient;
    const colorStops = colors
      .map((color, index) => {
        const stop = stops?.[index] ? ` ${stops[index]}` : '';
        return `${color}${stop}`;
      })
      .join(', ');

    if (type === 'linear') {
      heroStyle = {
        background: `linear-gradient(${
          direction || 'to right'
        }, ${colorStops})`,
      };
    } else if (type === 'radial') {
      heroStyle = {
        background: `radial-gradient(${direction || 'circle'}, ${colorStops})`,
      };
    }
  } else if (heroBackgroundColor) {
    // Apply solid background color if neither image nor gradient is enabled
    heroStyle = { backgroundColor: heroBackgroundColor };
  }

  return (
    <div className="relative overflow-hidden border-b" style={heroStyle}>
      {/* Overlay for background image if needed */}
      {hasOverlay && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0"
          style={overlayStyle}
        />
      )}
      <div className="container relative z-10 mx-auto px-0 py-6 sm:px-4 sm:py-8 md:px-6 md:py-12">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8 lg:gap-12">
          <div className="w-full space-y-3 px-4 sm:space-y-4 sm:px-0 md:w-1/2">
            <div className="space-y-2 sm:space-y-3">
              <Badge
                className="mb-1"
                style={{
                  backgroundColor: heroBadgeBgColor || undefined,
                  color: heroBadgeTextColor || undefined,
                  borderColor: heroBadgeBorderColor || undefined,
                }}
                variant={heroBadgeVariant}
              >
                {badge}
              </Badge>
              <h1
                className={cn(
                  'font-bold text-2xl tracking-tight sm:text-3xl md:text-4xl'
                )}
                style={{ color: heroTitleColor || undefined }}
              >
                {title}
              </h1>
              <p
                className={cn('text-muted-foreground text-sm md:text-base')}
                style={{ color: heroSubtitleColor || undefined }}
              >
                {description}
              </p>
            </div>
            {children}
          </div>

          {heroImageConfig?.enabled && heroImageConfig.src && (
            <div className="w-full px-4 sm:px-0 md:block md:w-1/2">
              <Image
                alt={heroImageConfig.alt || 'Hero image'}
                className="w-full rounded-lg object-cover md:w-auto"
                height={350}
                priority
                src={heroImageConfig.src}
                width={500}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
