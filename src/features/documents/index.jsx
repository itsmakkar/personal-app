import { useMemo, useState } from 'react'
import { useDocuments } from './hooks/useDocuments'

export default function DocumentsPage() {
  const { loading, error, documents, uploadAndProcessDocument, starterUploadCategoryOptions } = useDocuments()

  const [file, setFile] = useState(null)
  const [category, setCategory] = useState('therapy_guide')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const sortedDocs = useMemo(() => documents || [], [documents])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 900 }}>Documents</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
          Upload and build your personal library
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#64748b', fontWeight: 800 }}>
          Supported: PDF, JPG/PNG, plain text. Gemini will extract text and chunk it for the chatbot.
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Upload</div>

        <label style={{ fontSize: 13, color: '#64748b' }}>
          File
          <input
            type="file"
            accept=".pdf,image/*,.txt,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ width: '100%', marginTop: 8 }}
            disabled={uploading}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <label style={{ flex: 1, fontSize: 13, color: '#64748b' }}>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', marginTop: 6, height: 48, borderRadius: 10, border: '1px solid #d1d5db', background: 'white' }}
              disabled={uploading}
            >
              {starterUploadCategoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 10, fontSize: 13, color: '#64748b' }}>
          Description (optional)
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this document?"
            disabled={uploading}
            style={{
              width: '100%',
              marginTop: 6,
              height: 48,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              boxSizing: 'border-box',
              background: 'white',
            }}
          />
        </label>

        {uploadError ? <div style={{ marginTop: 10, color: '#dc2626', fontSize: 13 }}>{uploadError}</div> : null}

        <button
          style={{
            marginTop: 12,
            height: 52,
            width: '100%',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            fontWeight: 900,
            cursor: 'pointer',
            opacity: uploading ? 0.7 : 1,
          }}
          disabled={uploading || !file}
          onClick={async () => {
            setUploadError('')
            setUploading(true)
            try {
              await uploadAndProcessDocument({ file, category, description })
              setFile(null)
              setDescription('')
            } catch (e) {
              setUploadError(e?.message || 'Upload failed')
            } finally {
              setUploading(false)
            }
          }}
        >
          {uploading ? 'Uploading & processing...' : 'Upload & process'}
        </button>
      </div>

      {error ? <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div> : null}

      <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Your documents</div>

      {loading ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, color: '#64748b' }}>
          Loading...
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedDocs.map((d) => (
          <div
            key={d.docId}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 1000, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.fileName}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#64748b', fontWeight: 900 }}>
                  Category: {d.category || 'other'}
                </div>
                {d.description ? (
                  <div style={{ marginTop: 6, fontSize: 13, color: '#64748b', fontWeight: 800 }}>
                    {d.description}
                  </div>
                ) : null}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 10px',
                    borderRadius: 999,
                    background:
                      d.geminiStatus === 'ready'
                        ? '#dcfce7'
                        : d.geminiStatus === 'processing'
                          ? '#fffbeb'
                          : d.geminiStatus === 'failed'
                            ? '#fee2e2'
                            : '#f1f5f9',
                    color:
                      d.geminiStatus === 'ready'
                        ? '#16a34a'
                        : d.geminiStatus === 'processing'
                          ? '#d97706'
                          : d.geminiStatus === 'failed'
                            ? '#dc2626'
                            : '#64748b',
                    fontWeight: 1000,
                    fontSize: 12,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {d.geminiStatus || 'pending'}
                </div>
                {typeof d.chunkCount === 'number' ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#64748b', fontWeight: 900 }}>
                    Chunks: {d.chunkCount}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {!sortedDocs.length && !loading ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, color: '#64748b' }}>
            No documents yet. Upload your first file to enable chatbot context.
          </div>
        ) : null}
      </div>
    </div>
  )
}

