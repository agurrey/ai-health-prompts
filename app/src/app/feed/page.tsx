'use client';

import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { getSupabase, getAuthUser } from '@/lib/supabase';
import { getCommunityStatus } from '@/lib/auth';
import CommunityBanner from '@/components/CommunityBanner';
import FeedItemCard from '@/components/FeedItem';
import JoinCommunity from '@/components/JoinCommunity';
import type { FeedItem } from '@/lib/types/community';

const PAGE_SIZE = 20;

interface RawFeedRow {
  id: string;
  user_id: string;
  event_type: 'workout' | 'achievement' | 'pr' | 'streak';
  event_data: Record<string, string | number>;
  created_at: string;
  profiles: { username: string | null } | null;
  kudos: Array<{ id: string; user_id: string }>;
}

function mapRow(row: RawFeedRow, currentUserId: string | null): FeedItem {
  const kudosArray = row.kudos ?? [];
  return {
    id: row.id,
    user_id: row.user_id,
    event_type: row.event_type,
    event_data: row.event_data,
    created_at: row.created_at,
    username: row.profiles?.username ?? undefined,
    kudos_count: kudosArray.length,
    user_has_kudosed: currentUserId
      ? kudosArray.some((k) => k.user_id === currentUserId)
      : false,
  };
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-border rounded w-3/4" />
          <div className="h-3 bg-border rounded w-1/2" />
        </div>
        <div className="h-3 bg-border rounded w-12 shrink-0" />
      </div>
      <div className="flex justify-end">
        <div className="h-7 bg-border rounded w-16" />
      </div>
    </div>
  );
}

export default function FeedPage() {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<'loading' | 'none' | 'ready'>('loading');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [canKudos, setCanKudos] = useState(false);

  useEffect(() => {
    getCommunityStatus().then(s => {
      if (s === 'none') {
        setStatus('none');
      } else {
        setStatus('ready');
        setCanKudos(s !== 'anonymous');
      }
    });
    getAuthUser().then(u => setCurrentUserId(u?.id ?? null));
  }, []);

  const fetchItems = useCallback(async (off: number, userId: string | null) => {
    const sb = await getSupabase();
    if (!sb) return { rows: [], total: 0 };

    const { data, error } = await sb
      .from('activity_feed')
      .select(`
        *,
        profiles!activity_feed_user_id_fkey(username),
        kudos(id, user_id)
      `)
      .order('created_at', { ascending: false })
      .range(off, off + PAGE_SIZE - 1);

    if (error || !data) return { rows: [], total: 0 };

    const mapped = (data as RawFeedRow[]).map(row => mapRow(row, userId));
    return { rows: mapped, total: data.length };
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    (async () => {
      const userId = await getAuthUser().then(u => u?.id ?? null);
      setCurrentUserId(userId);
      const { rows } = await fetchItems(0, userId);
      setItems(rows);
      setOffset(rows.length);
      setHasMore(rows.length === PAGE_SIZE);
      setStatus('ready');
    })();
  }, [status, fetchItems]);

  async function loadMore() {
    setLoadingMore(true);
    const { rows } = await fetchItems(offset, currentUserId);
    setItems(prev => [...prev, ...rows]);
    setOffset(prev => prev + rows.length);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  async function handleKudos(feedItemId: string) {
    if (!canKudos || !currentUserId) return;

    // Optimistic update
    setItems(prev =>
      prev.map(item =>
        item.id === feedItemId
          ? { ...item, kudos_count: (item.kudos_count ?? 0) + 1, user_has_kudosed: true }
          : item
      )
    );

    const sb = await getSupabase();
    if (!sb) {
      // Revert
      setItems(prev =>
        prev.map(item =>
          item.id === feedItemId
            ? { ...item, kudos_count: Math.max(0, (item.kudos_count ?? 1) - 1), user_has_kudosed: false }
            : item
        )
      );
      return;
    }

    const { error } = await sb
      .from('kudos')
      .insert({ feed_item_id: feedItemId, user_id: currentUserId });

    if (error) {
      // Revert on failure (e.g. duplicate)
      setItems(prev =>
        prev.map(item =>
          item.id === feedItemId
            ? { ...item, kudos_count: Math.max(0, (item.kudos_count ?? 1) - 1), user_has_kudosed: false }
            : item
        )
      );
    }
  }

  if (status === 'none') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t('Activity Feed', 'Actividad')}
        </h1>
        <CommunityBanner onJoin={() => setShowJoinModal(true)} />
        <JoinCommunity
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => { setShowJoinModal(false); setStatus('loading'); }}
        />
      </div>
    );
  }

  const isInitialLoading = status === 'loading';

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t('Activity Feed', 'Actividad')}
      </h1>

      {!canKudos && status === 'ready' && (
        <p className="text-xs text-muted bg-card border border-border rounded-lg px-3 py-2">
          {t('Join with email to give kudos', 'Unete con email para dar kudos')}
        </p>
      )}

      <div className="space-y-3">
        {isInitialLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : items.length === 0 ? (
          <p className="text-center text-muted py-12 text-sm">
            {t(
              'No activity yet. Be the first to complete a workout!',
              'Sin actividad aun. Se el primero en completar un entrenamiento!'
            )}
          </p>
        ) : (
          items.map(item => (
            <FeedItemCard
              key={item.id}
              item={item}
              onKudos={handleKudos}
              lang={lang}
            />
          ))
        )}
      </div>

      {hasMore && !isInitialLoading && items.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-accent transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingMore
              ? t('Loading...', 'Cargando...')
              : t('Load more', 'Cargar mas')}
          </button>
        </div>
      )}
    </div>
  );
}
