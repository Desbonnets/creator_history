import JSZip from 'jszip'
import type { AppData } from '../types'

export async function exportToZip(data: AppData): Promise<void> {
  const zip = new JSZip()
  zip.file('data.json', JSON.stringify(data, null, 2))
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `worldbuilder_${new Date().toISOString().slice(0, 10)}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromZip(file: File): Promise<AppData> {
  const zip = await JSZip.loadAsync(file)
  const dataFile = zip.file('data.json')
  if (!dataFile) throw new Error('data.json introuvable dans le ZIP')
  const content = await dataFile.async('string')
  return JSON.parse(content) as AppData
}
