import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import { SHOP_ITEMS, SHOP_CATEGORIES } from '../utils/shopItems';
import { SIDEBAR_REFRESH_EVENT } from '../components/StickyPostSidebar';
import { COLOR_SCHEME_EVENT } from '../components/Layout';
import type { EquippedItems } from '../types';
import type { ShopCategory } from '../types';

const STICKYPOST_PRICE = 10;
const MAX_POST_LENGTH = 255;

export default function Shop() {
  const { session, updateBalance } = useAuth();
  const { apiFetch } = useApi();
  const toast = useToast();

  const [inventory, setInventory] = useState<string[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({});
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('emoji');
  const [showPostForm, setShowPostForm] = useState(false);
  const [postText, setPostText] = useState('');
  const [postBusy, setPostBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/players/${session.username}`)
      .then((r) => r.json())
      .then((d) => {
        setInventory(d.player?.inventory ?? []);
        setEquippedItems(d.player?.equippedItems ?? {});
        setBalance(d.player?.balance ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  const handleBuy = async (itemId: string) => {
    setBusyItem(itemId);
    try {
      const result = await apiFetch<{
        ok: boolean;
        balance: number;
        inventory: string[];
        equippedItems: EquippedItems;
      }>('/api/shop', { method: 'POST', body: JSON.stringify({ action: 'buy', itemId }) });
      setInventory(result.inventory);
      setEquippedItems(result.equippedItems);
      setBalance(result.balance);
      updateBalance(result.balance);
      const item = SHOP_ITEMS.find((i) => i.id === itemId)!;
      toast(`Bought & equipped "${item.name}"!`, 'success');
      if (item.category === 'colorScheme') {
        window.dispatchEvent(new CustomEvent(COLOR_SCHEME_EVENT, { detail: result.equippedItems.colorScheme ?? null }));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Purchase failed', 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const handleEquip = async (itemId: string | null, category?: ShopCategory) => {
    setBusyItem(itemId ?? (category ?? 'unequip'));
    try {
      const result = await apiFetch<{ ok: boolean; equippedItems: EquippedItems }>(
        '/api/shop',
        { method: 'POST', body: JSON.stringify({ action: 'equip', itemId, category }) },
      );
      setEquippedItems(result.equippedItems);
      toast(itemId ? 'Item equipped!' : 'Item unequipped.', 'success');
      const item = itemId ? SHOP_ITEMS.find((i) => i.id === itemId) : null;
      if (item?.category === 'colorScheme' || category === 'colorScheme') {
        window.dispatchEvent(new CustomEvent(COLOR_SCHEME_EVENT, { detail: result.equippedItems.colorScheme ?? null }));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Equip failed', 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPostBusy(true);
    try {
      const result = await apiFetch<{ ok: boolean; balance: number }>('/api/shop', {
        method: 'POST',
        body: JSON.stringify({ action: 'stickypost', text: postText }),
      });
      setBalance(result.balance);
      updateBalance(result.balance);
      setPostText('');
      setShowPostForm(false);
      window.dispatchEvent(new CustomEvent(SIDEBAR_REFRESH_EVENT));
      toast('StickyPost published! 📌', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Post failed', 'error');
    } finally {
      setPostBusy(false);
    }
  };

  const categoryItems = SHOP_ITEMS.filter((i) => i.category === activeCategory);
  const activeCategoryMeta = SHOP_CATEGORIES.find((c) => c.key === activeCategory)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <h1
          className="font-display text-gold"
          style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 900 }}
        >
          The Shop
        </h1>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          Spend your shekels on cosmetics. Flex on the competition.
        </p>
      </div>

      {/* StickyPost consumable */}
      {session && (
        <div
          className="card"
          style={{
            padding: '1rem 1.25rem',
            border: '1px solid rgba(245,200,66,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>📌</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>StickyPost</span>
                <span className="text-gold" style={{ fontWeight: 800 }}>{STICKYPOST_PRICE} ₪</span>
              </div>
              <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
                Post a public message pinned to the board. Shows up for everyone. Max {MAX_POST_LENGTH} characters.
              </p>
            </div>
            {!showPostForm && (
              <button
                className="btn btn-gold btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => setShowPostForm(true)}
                disabled={balance === null || balance < STICKYPOST_PRICE}
                title={balance !== null && balance < STICKYPOST_PRICE ? 'Not enough shekels' : undefined}
              >
                Buy & Post
              </button>
            )}
          </div>

          {showPostForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value.slice(0, MAX_POST_LENGTH))}
                placeholder="Write something the group needs to know…"
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                  color: 'var(--color-text)',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {postText.length}/{MAX_POST_LENGTH}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => { setShowPostForm(false); setPostText(''); }}
                    disabled={postBusy}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={handlePost}
                    disabled={postBusy || !postText.trim()}
                  >
                    {postBusy ? 'Posting…' : `Post for ${STICKYPOST_PRICE} ₪`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balance + info bar */}
      {!loading && balance !== null && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span className="text-muted" style={{ fontSize: '0.88rem' }}>
            Your balance
          </span>
          <span className="text-gold" style={{ fontWeight: 800, fontSize: '1.3rem' }}>
            {balance.toLocaleString()} ₪
          </span>
        </div>
      )}

      {/* Category tabs */}
      <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
        {SHOP_CATEGORIES.map((cat) => {
          const ownedInCat = SHOP_ITEMS.filter(
            (i) => i.category === cat.key && inventory.includes(i.id),
          ).length;
          return (
            <button
              key={cat.key}
              className={`tab${activeCategory === cat.key ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {cat.label}
              {ownedInCat > 0 && (
                <span
                  style={{
                    marginLeft: '0.4rem',
                    fontSize: '0.68rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: 'rgba(74,158,255,0.2)',
                    color: 'var(--color-blue)',
                  }}
                >
                  {ownedInCat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category description */}
      <p className="text-muted" style={{ margin: 0, fontSize: '0.88rem' }}>
        {activeCategoryMeta.description}
      </p>

      {/* Items grid */}
      {loading ? (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '0.75rem' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '10px' }} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))',
            gap: '0.75rem',
          }}
        >
          {categoryItems.map((item) => {
            const owned = inventory.includes(item.id);
            const equipped = equippedItems[item.category] === item.id;
            const busy = busyItem === item.id;
            const canAfford = balance !== null && balance >= item.price;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '1rem',
                  border: equipped
                    ? '1px solid rgba(74,158,255,0.5)'
                    : owned
                      ? '1px solid rgba(245,200,66,0.25)'
                      : '1px solid var(--color-border)',
                  background: equipped
                    ? 'rgba(74,158,255,0.06)'
                    : 'var(--color-bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                {/* Item header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{item.preview}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {item.name}
                      {equipped && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: 'rgba(74,158,255,0.15)',
                            color: 'var(--color-blue)',
                            border: '1px solid rgba(74,158,255,0.3)',
                          }}
                        >
                          EQUIPPED
                        </span>
                      )}
                      {owned && !equipped && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            background: 'rgba(245,200,66,0.1)',
                            color: 'var(--color-gold-dim)',
                            border: '1px solid rgba(245,200,66,0.2)',
                          }}
                        >
                          OWNED
                        </span>
                      )}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.1rem' }}>
                      {item.description}
                    </div>
                  </div>
                </div>

                {/* Price + action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: owned ? 'var(--color-text-muted)' : canAfford ? 'var(--color-gold)' : 'var(--color-red)',
                    }}
                  >
                    {owned ? 'Owned' : `${item.price.toLocaleString()} ₪`}
                  </span>

                  {equipped ? (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleEquip(null, item.category)}
                      disabled={busy}
                    >
                      Unequip
                    </button>
                  ) : owned ? (
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--color-blue-dim)', color: '#fff' }}
                      onClick={() => handleEquip(item.id)}
                      disabled={busy}
                    >
                      {busy ? '…' : 'Equip'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-gold btn-sm"
                      onClick={() => handleBuy(item.id)}
                      disabled={busy || !canAfford || !session}
                      title={!canAfford ? 'Not enough shekels' : undefined}
                    >
                      {busy ? 'Buying…' : 'Buy & Equip'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Not logged in */}
      {!session && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="text-muted">Log in to browse the shop.</p>
        </div>
      )}
    </div>
  );
}
