'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, total, limit, onPageChange }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pages = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Menampilkan {from}–{to} dari {total} data
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={16} />
        </button>

        {pages[0] > 1 && (
          <>
            <PageBtn n={1} current={page} onClick={onPageChange} />
            {pages[0] > 2 && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
          </>
        )}

        {pages.map(n => (
          <PageBtn key={n} n={n} current={page} onClick={onPageChange} />
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>
            )}
            <PageBtn n={totalPages} current={page} onClick={onPageChange} />
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function PageBtn({ n, current, onClick }) {
  const active = n === current
  return (
    <button
      onClick={() => onClick(n)}
      className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
      style={{
        background: active ? 'var(--brand)' : 'var(--bg-elevated)',
        color: active ? 'white' : 'var(--text-secondary)',
        boxShadow: active ? '0 0 10px var(--brand-glow)' : 'none'
      }}>
      {n}
    </button>
  )
}
