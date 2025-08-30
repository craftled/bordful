import { Mail, MapPin, Phone } from 'lucide-react';
// No card components needed
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

type ContactInfoSectionProps = {
  title: string;
  description: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
};

export function ContactInfoSection({
  title,
  description,
  companyName,
  email,
  phone,
  address,
}: ContactInfoSectionProps) {
  const primaryColor = resolveColor(config.ui.primaryColor);

  return (
    <div className="rounded-lg border p-5 transition-all hover:border-gray-400">
      <div className="pb-4">
        <h3 className="font-semibold text-xl text-zinc-900">{title}</h3>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
      <div>
        <div className="space-y-4">
          <p className="font-medium text-zinc-900">{companyName}</p>

          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-zinc-500" />
            <a
              className="text-sm hover:underline"
              href={`mailto:${email}`}
              style={{ color: primaryColor }}
            >
              {email}
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-zinc-500" />
            <a
              className="text-sm hover:underline"
              href={`tel:${phone.replace(/\D/g, '')}`}
              style={{ color: primaryColor }}
            >
              {phone}
            </a>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-700">{address}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
