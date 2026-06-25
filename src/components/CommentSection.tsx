import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';

const EMOJIS = ['💪', '🔥', '😤', '🤡', '😂', '👀', '💀', '🙏', '🤝', '👑', '🥱', '😴', '🎯', '🏆', '🤌', '😏'];

const GIF_REGEX = /https?:\/\/[^\s]+(?:gif|giphy|tenor)[^\s]*/i;

interface Comment {
  id: number;
  user_id: number;
  user_name: string;
  message: string;
  created_at: string;
}

export function CommentSection() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const fetch = async () => {
    try {
      const data = await api.comments.list();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments]);

  const handleSend = async () => {
    if (!message.trim() || sending || !user) return;
    setSending(true);
    await api.comments.create({ user_id: user.id, user_name: user.name, message: message.trim() });
    setMessage('');
    setShowEmojis(false);
    await fetch();
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const renderMessage = (text: string) => {
    const isGif = GIF_REGEX.test(text);
    if (isGif) {
      const url = text.match(GIF_REGEX)![0];
      const before = text.slice(0, text.indexOf(url));
      const after = text.slice(text.indexOf(url) + url.length);
      return (
        <>
          {before && <span>{before} </span>}
          <img src={url} alt="gif" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4 }} />
          {after && <span> {after}</span>}
        </>
      );
    }
    return text;
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Trash Talk</h2>

      <div ref={listRef} style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comments.length === 0 && (
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)', textAlign: 'center', padding: 16 }}>
            No trash talk yet. Be the first!
          </p>
        )}
        {[...comments].reverse().map(c => (
          <div key={c.id} style={{
            padding: '8px 10px', borderRadius: 'var(--radius)',
            background: String(c.user_id) === String(user?.id) ? 'var(--orange-500-15)' : 'var(--slate-800)',
            alignSelf: String(c.user_id) === String(user?.id) ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--orange-400)', marginBottom: 2 }}>{c.user_name}</p>
            <p style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>{renderMessage(c.message)}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: 4 }}>
              {new Date(c.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Drop some trash talk... (paste GIF URLs)"
            rows={2}
          />
          {showEmojis && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0,
              background: 'var(--slate-800)', border: '1px solid var(--slate-600)',
              borderRadius: 'var(--radius)', padding: 8,
              display: 'flex', flexWrap: 'wrap', gap: 4, width: 240, zIndex: 10,
            }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => insertEmoji(e)} style={{ fontSize: '1.2rem', padding: 4 }}>{e}</button>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-secondary" onClick={() => setShowEmojis(s => !s)} style={{ padding: '10px 12px' }}>😊</button>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending || !message.trim()} style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
          Send
        </button>
      </div>
    </div>
  );
}
