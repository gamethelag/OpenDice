import { useState } from 'react'
import { useDiceStore } from '../state/useDiceStore.js'
import { exportLibraryEntries } from '../export/exportSTL.js'

export function DiceLibrary({ onSaveDice }) {
  const diceLibrary = useDiceStore(s => s.diceLibrary)
  const loadDiceFromLibrary = useDiceStore(s => s.loadDiceFromLibrary)
  const deleteDiceFromLibrary = useDiceStore(s => s.deleteDiceFromLibrary)
  const renameDiceInLibrary = useDiceStore(s => s.renameDiceInLibrary)
  const loadedFonts = useDiceStore(s => s.loadedFonts)
  const diceType = useDiceStore(s => s.diceType)
  const sizeInMM = useDiceStore(s => s.sizeInMM)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isExporting, setIsExporting] = useState(false)

  const handleSave = () => {
    const name = `${diceType.toUpperCase()} · ${sizeInMM}mm`
    onSaveDice(name)
  }

  const startRename = (entry) => {
    setEditingId(entry.id)
    setEditName(entry.name)
  }

  const commitRename = (id) => {
    if (editName.trim()) renameDiceInLibrary(id, editName.trim())
    setEditingId(null)
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExportSelected = async () => {
    if (isExporting || selectedIds.size === 0) return
    const entries = diceLibrary.filter(e => selectedIds.has(e.id))
    setIsExporting(true)
    try {
      await exportLibraryEntries(entries, loadedFonts)
    } catch (e) {
      console.error('Library export failed:', e)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="dice-library">
      <div className="library-header">
        <button className="btn-save-to-library" onClick={handleSave}>
          + Save Current Die
        </button>
        <button
          className="btn-export-selected"
          onClick={handleExportSelected}
          disabled={isExporting || selectedIds.size === 0}
        >
          {isExporting ? 'Exporting…' : selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export'}
        </button>
      </div>

      {diceLibrary.length === 0 ? (
        <p className="library-empty">No saved dice yet. Click above to save the current die.</p>
      ) : (
        <div className="library-list">
          {diceLibrary.map(entry => (
            <div
              key={entry.id}
              className={`library-card${selectedIds.has(entry.id) ? ' selected' : ''}`}
              onClick={() => loadDiceFromLibrary(entry.id)}
              title="Click to load"
            >
              <label className="library-select" title="Select for export" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => toggleSelect(entry.id)}
                />
              </label>
              <div className="library-thumb">
                {entry.thumbnail
                  ? <img src={entry.thumbnail} alt={entry.name} />
                  : <span className="library-thumb-placeholder">{entry.diceType.toUpperCase()}</span>
                }
              </div>
              <div className="library-info">
                {editingId === entry.id ? (
                  <input
                    className="library-name-input"
                    value={editName}
                    autoFocus
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => commitRename(entry.id)}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(entry.id) }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="library-name" onClick={e => { e.stopPropagation(); startRename(entry) }} title="Click to rename">
                    {entry.name}
                  </span>
                )}
                <span className="library-meta">{entry.diceType.toUpperCase()} · {entry.sizeInMM}mm</span>
              </div>
              <div className="library-actions">
                <button className="btn-library-delete" onClick={e => { e.stopPropagation(); deleteDiceFromLibrary(entry.id) }} title="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
