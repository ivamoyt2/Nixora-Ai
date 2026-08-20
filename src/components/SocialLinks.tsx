import React, { useState } from 'react';
import { Youtube, Instagram, Share2, ExternalLink, Check, Copy } from 'lucide-react';

interface SocialLinksProps {
  variant?: 'compact' | 'cards' | 'banner';
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const channels = [
    {
      id: 'youtube',
      name: 'YouTube',
      handle: '@ShadowTales-x6t',
      url: 'https://youtube.com/@ShadowTales-x6t',
      icon: <Youtube className="w-5 h-5" />,
      color: 'hover:border-red-500/50 hover:bg-red-500/10 text-red-400',
      badge: 'شروحات وفيديوهات',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@akvus30',
      url: 'https://instagram.com/akvus30',
      icon: <Instagram className="w-5 h-5" />,
      color: 'hover:border-pink-500/50 hover:bg-pink-500/10 text-pink-400',
      badge: 'كواليس وتحديثات',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: '@ivamoyt2',
      url: 'https://tiktok.com/@ivamoyt2',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.3 6.3 0 0 0 1.87-4.47V8.69a8.18 8.18 0 0 0 4.91 1.63v-3.63z" />
        </svg>
      ),
      color: 'hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400',
      badge: 'ريلز وشورتس',
    },
  ];

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {channels.map((ch) => (
          <a
            key={ch.id}
            href={ch.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-5 rounded-2xl bg-[#090D16] border border-blue-950/80 hover:border-blue-500/40 transition duration-200 flex flex-col justify-between gap-4 group cursor-pointer text-right shadow-lg ${ch.color}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition">
                  {ch.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition">
                    {ch.name}
                  </h4>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-slate-200" dir="ltr">
                    {ch.handle}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
              <span className="text-[11px] font-medium text-slate-400">
                {ch.badge}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopy(e, ch.url, ch.id)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="نسخ الرابط"
              >
                {copiedId === ch.id ? (
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </a>
        ))}
      </div>
    );
  }

  // Compact variant
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {channels.map((ch) => (
        <a
          key={ch.id}
          href={ch.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090D16] border border-blue-950/80 text-xs font-mono text-slate-300 hover:text-white transition group ${ch.color}`}
        >
          <span className="group-hover:scale-110 transition">{ch.icon}</span>
          <span dir="ltr" className="font-semibold">{ch.handle}</span>
        </a>
      ))}
    </div>
  );
};
