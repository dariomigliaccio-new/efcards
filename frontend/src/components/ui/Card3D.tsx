'use client';

import { useCard3D } from '@/hooks/useCard3D';
import type { Rarity } from '@/types';
import Link from 'next/link';

interface Card3DProps {
  id: string;
  playerName: string;
  team?: string;
  sport: string;
  rarity: Rarity;
  imageUrl?: string;
  year?: number;
  collectionName: string;
  price?: number;
  currentBid?: number;
  endsAt?: string;
  sellerUsername?: string;
  href?: string;
  className?: string;
  showPrice?: boolean;
  isAuction?: boolean;
}

const RARITY_COLORS: Record<Rarity, string> = {
  legendary: 'rgba(201,169,110,0.4)',
  ultra_rare:'rgba(139,92,246,0.35)',
  rare:      'rgba(74,144,217,0.3)',
  uncommon:  'rgba(76,175,125,0.25)',
  common:    'rgba(255,255,255,0.05)',
};

export function Card3D({
  id, playerName, team, sport, rarity, imageUrl, year,
  collectionName, price, currentBid, endsAt, sellerUsername,
  href, className = '', showPrice = true, isAuction = false,
}: Card3DProps) {
  const { cardRef, glowRef, shineRef, onMouseMove, onMouseEnter, onMouseLeave } = useCard3D<HTMLDivElement>({
    intensity:  16,
    glowColor:  RARITY_COLORS[rarity] || 'rgba(201,169,110,0.25)',
    liftAmount: 10,
  });

  const content = (
    <div
      ref={cardRef}
      className={`sport-card rarity-${rarity} aspect-[2.5/3.5] w-full cursor-pointer ${className}`}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: imageUrl
            ? 'transparent'
            : `linear-gradient(160deg, rgba(35,25,15,1) 0%, rgba(12,10,7,1) 70%)`,
        }}
      />

      {/* Card image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={playerName}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Shine layer */}
      <div ref={shineRef} className="card-shine" />

      {/* Glow ring */}
      <div ref={glowRef} className="absolute inset-0 rounded-[12px] pointer-events-none opacity-0" />

      {/* Holographic sweep for rare+ */}
      {(rarity === 'legendary' || rarity === 'ultra_rare') && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,100,0.3) 50%, transparent 60%)',
            backgroundSize: '200% 200%',
            animation: 'holographic 5s linear infinite',
          }}
        />
      )}

      {/* Top row — sport + rarity */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <span className="label text-[0.55rem] text-white/40">{sport?.toUpperCase()}</span>
        <span className={`badge badge-${rarity}`}>
          {rarity === 'ultra_rare' ? 'Ultra' : rarity === 'legendary' ? 'Legend' : rarity}
        </span>
      </div>

      {/* Bottom info */}
      <div className="card-info z-10">
        <p className="text-[0.55rem] uppercase tracking-widest text-gold/50 mb-0.5 truncate">
          {collectionName} {year ? `· ${year}` : ''}
        </p>
        <p className="font-display text-sm font-medium text-white/95 truncate">{playerName}</p>
        {team && <p className="text-[0.65rem] text-white/40 mt-0.5 truncate">{team}</p>}

        {/* Price reveal on hover */}
        {showPrice && (price || currentBid) && (
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-[0.55rem] uppercase tracking-wider text-white/30">
                {isAuction ? 'Current bid' : 'Price'}
              </p>
              <p className="text-sm font-medium text-gold">
                ${(isAuction ? currentBid : price)?.toFixed(2)}
              </p>
            </div>
            {isAuction && endsAt && (
              <AuctionCountdown endsAt={endsAt} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block card-3d-wrapper">{content}</Link>;
  return <div className="card-3d-wrapper">{content}</div>;
}

function AuctionCountdown({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt);
  const now = new Date();
  const diff = Math.max(0, end.getTime() - now.getTime());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  return (
    <div className="text-right">
      <p className="text-[0.55rem] uppercase tracking-wider text-white/30">Ends in</p>
      <p className="text-xs font-mono text-white/70">
        {h > 0 ? `${h}h ` : ''}{m}m
      </p>
    </div>
  );
}
