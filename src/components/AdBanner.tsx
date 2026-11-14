import React, { useState } from 'react';
import { BANNER_CONFIGS, openAdMonetizationLink, EARN_MORE_SHORT_LINK } from '../utils/adLinks';
import { ExternalLink, Sparkles } from 'lucide-react';

interface AdBannerProps {
  slot: keyof typeof BANNER_CONFIGS;
  label?: string;
  showBonusAction?: boolean;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  label = 'Sponsored Ad',
  showBonusAction = false,
  className = '',
}) => {
  const config = BANNER_CONFIGS[slot];
  const [hasInteracted, setHasInteracted] = useState(false);

  if (!config) return null;

  // Construct srcDoc for high-reliability sandboxed script execution
  const adHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <base target="_blank">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #090d16;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            font-family: system-ui, sans-serif;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${config.key}',
            'format' : '${config.format}',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/${config.key}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-inner overflow-hidden ${className}`}>
      {/* Label and monetization trigger */}
      <div className="w-full flex items-center justify-between gap-2 mb-2 px-1 text-[11px] text-slate-400">
        <span className="font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
          {label} ({config.width}x{config.height})
        </span>

        <button
          onClick={() => {
            setHasInteracted(true);
            openAdMonetizationLink('earn_more');
          }}
          className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
          title="Click to open sponsored link and support high earnings"
        >
          <span>Open High CPM Ad</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Frame Container */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded bg-slate-950/80 max-w-full"
        style={{
          width: '100%',
          maxWidth: `${config.width}px`,
          minHeight: `${config.height}px`,
        }}
      >
        <iframe
          title={`ad-${config.key}`}
          srcDoc={adHtml}
          width={config.width}
          height={config.height}
          scrolling="no"
          className="border-0 overflow-hidden block mx-auto max-w-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        />

        {/* Fallback interactive sponsor overlay if ad is blocked or loading */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-slate-950/40">
          <a
            href={EARN_MORE_SHORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-3 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition-colors shadow-lg flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            Click To Visit High CPM Sponsor
          </a>
        </div>
      </div>

      {showBonusAction && (
        <div className="w-full mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">Interacting with sponsored links increases daily multiplier</span>
          <button
            onClick={() => openAdMonetizationLink('earn_more')}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            {hasInteracted ? '✓ Verified Click' : 'Visit & Earn Extra $'}
          </button>
        </div>
      )}
    </div>
  );
};
