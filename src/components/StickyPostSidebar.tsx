import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { SHOP_ITEMS_BY_ID } from '../utils/shopItems';
import type { StickyPostWithPlayer } from '../types';

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const SIDEBAR_REFRESH_EVENT = 'stickypost:refresh';

export default function StickyPostSidebar() {
  const { session } = useAuth();
  const { apiFetch } = useApi();
  const [open, setOpen] = useState(true);
  const [posts, setPosts] = useState<StickyPostWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await fetch('/api/stickyposts').then((r) => r.json());
      setPosts(data.posts ?? []);
    } catch {
      // silent — sidebar is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    window.addEventListener(SIDEBAR_REFRESH_EVENT, fetchPosts);
    return () => window.removeEventListener(SIDEBAR_REFRESH_EVENT, fetchPosts);
  }, [fetchPosts]);

  const handleDelete = async (postId: string) => {
    setDeleting(postId);
    try {
      await apiFetch(`/api/stickyposts?id=${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const handleVote = async (postId: string, vote: 'up' | 'down') => {
    setVoting(postId);
    try {
      const result = await apiFetch<{
        ok: boolean;
        updoots: number;
        downdoots: number;
        myVote: 'up' | 'down' | null;
      }>('/api/stickyposts', {
        method: 'POST',
        body: JSON.stringify({ postId, vote }),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                updoots: result.updoots,
                downdoots: result.downdoots,
                votes: {
                  ...p.votes,
                  ...(result.myVote
                    ? { [session!.username]: result.myVote }
                    : Object.fromEntries(
                        Object.entries(p.votes ?? {}).filter(([k]) => k !== session!.username),
                      )),
                },
              }
            : p,
        ),
      );
    } catch {
      // silent
    } finally {
      setVoting(null);
    }
  };

  return (
    <div
      style={{
        width: open ? '260px' : '32px',
        flexShrink: 0,
        background: 'var(--color-bg-card)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        maxHeight: '100vh',
        overflowY: 'auto',
        transition: 'width 0.2s ease',
      }}
      className="sticky-sidebar"
    >
      {open ? (
        <>
          {/* Header */}
          <div
            style={{
              padding: '0.65rem 0.75rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-gold)' }}>
              📌 Sticky Board
            </span>
            <button
              onClick={() => setOpen(false)}
              title="Collapse"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.1rem 0.3rem',
                borderRadius: '4px',
                lineHeight: 1,
              }}
            >
              ◀
            </button>
          </div>

          {/* Posts */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '6px' }} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center' }}>
                <p className="text-muted" style={{ fontSize: '0.78rem', margin: 0 }}>
                  No posts yet.
                  <br />Buy a StickyPost in the Shop!
                </p>
              </div>
            ) : (
              posts.map((post, idx) => {
                const equippedEmoji = post.authorEquippedItems.emoji
                  ? SHOP_ITEMS_BY_ID[post.authorEquippedItems.emoji]?.preview
                  : null;
                const equippedTitle = post.authorEquippedItems.profileTitle
                  ? SHOP_ITEMS_BY_ID[post.authorEquippedItems.profileTitle]?.name
                  : null;
                const isOwn = session?.username === post.author;
                const myVote = session ? (post.votes?.[session.username] ?? null) : null;
                const isVoting = voting === post.id;

                return (
                  <div
                    key={post.id}
                    style={{
                      padding: '0.65rem 0.75rem',
                      borderBottom: idx < posts.length - 1 ? '1px solid var(--color-border)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    {/* Author row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: 'var(--color-gold)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {post.author}
                          {equippedEmoji && (
                            <span style={{ marginLeft: '0.25rem' }}>{equippedEmoji}</span>
                          )}
                        </span>
                        {equippedTitle && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--color-text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {equippedTitle}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {relativeTime(post.createdAt)}
                        </span>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deleting === post.id}
                            title="Delete post"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--color-red)',
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.2rem',
                              borderRadius: '3px',
                              lineHeight: 1,
                              opacity: deleting === post.id ? 0.5 : 1,
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        color: 'var(--color-text)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {post.text}
                    </p>

                    {/* Votes row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                      {!isOwn && session ? (
                        <>
                          <button
                            onClick={() => handleVote(post.id, 'up')}
                            disabled={isVoting}
                            title="Updoot"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              background: myVote === 'up' ? 'rgba(61,220,132,0.15)' : 'none',
                              border: myVote === 'up' ? '1px solid rgba(61,220,132,0.4)' : '1px solid var(--color-border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              padding: '0.15rem 0.4rem',
                              fontSize: '0.72rem',
                              color: myVote === 'up' ? 'var(--color-green)' : 'var(--color-text-muted)',
                              fontWeight: myVote === 'up' ? 700 : 400,
                              opacity: isVoting ? 0.5 : 1,
                              transition: 'all 0.12s',
                            }}
                          >
                            👍 {post.updoots ?? 0}
                          </button>
                          <button
                            onClick={() => handleVote(post.id, 'down')}
                            disabled={isVoting}
                            title="Downdoot"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              background: myVote === 'down' ? 'rgba(255,87,87,0.12)' : 'none',
                              border: myVote === 'down' ? '1px solid rgba(255,87,87,0.35)' : '1px solid var(--color-border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              padding: '0.15rem 0.4rem',
                              fontSize: '0.72rem',
                              color: myVote === 'down' ? 'var(--color-red)' : 'var(--color-text-muted)',
                              fontWeight: myVote === 'down' ? 700 : 400,
                              opacity: isVoting ? 0.5 : 1,
                              transition: 'all 0.12s',
                            }}
                          >
                            👎 {post.downdoots ?? 0}
                          </button>
                        </>
                      ) : (
                        /* Own post or logged out — show counts as read-only */
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {(post.updoots ?? 0) > 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-green)' }}>
                              👍 {post.updoots}
                            </span>
                          )}
                          {(post.downdoots ?? 0) > 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-red)' }}>
                              👎 {post.downdoots}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Collapsed toggle */
        <button
          onClick={() => setOpen(true)}
          title="Open sticky board"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '32px',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold)',
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              letterSpacing: '0.05em',
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          >
            📌 Board ▶
          </span>
        </button>
      )}
    </div>
  );
}
