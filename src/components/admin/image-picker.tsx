'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react';
import { errorMessage } from '@/lib/admin/api';
import type { MediaItem } from '@/lib/admin/types';
import { useAdmin } from '@/components/admin/session';
import { Pager, usePaged } from '@/components/admin/paged-list';
import { Field, Notice, fieldClass, secondaryButton } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

/** The four ways an image can sit in a post (classes styled in globals.css as figure.media-*). */
export const IMAGE_LAYOUTS = [
  { key: 'below', label: 'Photo, text below', hint: 'The photo, then a caption or paragraph under it.' },
  { key: 'overlay', label: 'Text on the photo', hint: 'Your words over the image on a soft dark gradient.' },
  { key: 'side', label: 'Photo beside text', hint: 'Photo on the left, text on the right; stacks on phones.' },
  { key: 'wide', label: 'Wide photo', hint: 'A banner wider than the text column, small caption.' },
] as const;

export type ImageLayout = (typeof IMAGE_LAYOUTS)[number]['key'];

const MAX_SIDE = 1600;
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The figure HTML for an image in one of the layouts. */
export function figureHtml(image: MediaItem, layout: ImageLayout, alt: string, text: string) {
  const caption = text.trim() ? `<figcaption>${escapeHtml(text.trim())}</figcaption>` : '';
  return `<figure class="media media-${layout}"><img src="${image.url}" alt="${escapeHtml(alt.trim())}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async">${caption}</figure>`;
}

/**
 * Shrinks a photo in the browser before upload: at most 1600 px on its longest
 * side, re-encoded as WebP (JPEG where WebP encoding isn't available). GIFs are
 * kept as they are so animations survive. Returns the file to send and its size.
 */
async function prepare(file: File): Promise<{ blob: Blob; name: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  if (file.type === 'image/gif') {
    bitmap.close();
    return { blob: file, name: file.name, width, height };
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const encode = (type: string, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await encode('image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg', 0.85);
  if (!blob) throw new Error("This image couldn't be processed.");
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return { blob, name: `${base}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`, width: w, height: h };
}

/**
 * Upload an image or pick an earlier one, choose a layout, add alt text and
 * optional words, and insert it into the post. Images are optional.
 */
export function ImagePicker({ onInsert, onClose }: { onInsert: (html: string) => void; onClose: () => void }) {
  const { call } = useAdmin();
  const { data, error, isLoading, setPage, reload } = usePaged<MediaItem>('GetImages', {}, 12);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [layout, setLayout] = useState<ImageLayout>('below');
  const [alt, setAlt] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    dialog.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setStatus(null);
    if (!TYPES.includes(file.type)) return setStatus({ kind: 'error', text: 'Choose a PNG, JPEG, WebP or GIF image.' });
    setBusy(true);
    try {
      const ready = await prepare(file);
      if (ready.blob.size > MAX_BYTES) throw new Error('Even after resizing this image is over 2 MB. Try a smaller one.');
      const form = new FormData();
      form.append('file', ready.blob, ready.name);
      form.append('width', String(ready.width));
      form.append('height', String(ready.height));
      const item = await call<MediaItem>('UploadImage', form);
      setSelected(item);
      setAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
      setStatus({ kind: 'success', text: `Uploaded (${Math.round(item.bytes / 1024)} KB, ${item.width}×${item.height}).` });
      reload();
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: MediaItem) => {
    if (!window.confirm('Delete this image? Posts that use it will show a broken image.')) return;
    try {
      await call('DeleteImage', { id: item.id });
      if (selected?.id === item.id) setSelected(null);
      reload();
    } catch (e) {
      setStatus({ kind: 'error', text: errorMessage(e) });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void upload(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Insert an image"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass glass-strong max-h-[92dvh] w-full max-w-4xl overflow-y-auto p-5 sm:p-6 focus:outline-none"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Insert an image</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-foreground/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              disabled={busy}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-sm transition-colors',
                isDragging ? 'border-primary bg-primary/10' : 'border-foreground/20 hover:bg-foreground/5',
              )}
            >
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6 text-primary" />}
              <span className="font-medium">{busy ? 'Resizing and uploading…' : 'Drop an image here, or choose one'}</span>
              <span className="text-xs text-muted-foreground">PNG, JPEG, WebP or GIF · resized to 1600 px and compressed before upload</span>
            </button>
            <input ref={input} type="file" accept={TYPES.join(',')} hidden onChange={(e) => void upload(e.target.files?.[0])} />
            {(status || error) && <Notice kind={status?.kind ?? 'error'}>{status?.text ?? error}</Notice>}

            <div>
              <p className="mb-2 text-sm font-semibold">Or pick an earlier upload</p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {data?.items.map((item) => (
                  <li key={item.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      aria-pressed={selected?.id === item.id}
                      title={item.name}
                      className={cn('block aspect-square w-full overflow-hidden rounded-xl ring-2 transition', selected?.id === item.id ? 'ring-primary' : 'ring-transparent hover:ring-foreground/30')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(item)}
                      aria-label={`Delete ${item.name}`}
                      className="absolute right-1 top-1 hidden h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              {data && data.items.length === 0 && <p className="text-sm text-muted-foreground">No images uploaded yet.</p>}
              <Pager data={data} onPage={setPage} isLoading={isLoading} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold">Layout</p>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_LAYOUTS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setLayout(l.key)}
                    aria-pressed={layout === l.key}
                    title={l.hint}
                    className={cn('rounded-xl p-2 text-left text-xs ring-1 transition', layout === l.key ? 'bg-primary/15 ring-primary' : 'ring-foreground/15 hover:bg-foreground/5')}
                  >
                    <LayoutSketch layout={l.key} />
                    <span className="mt-1.5 block font-medium">{l.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{IMAGE_LAYOUTS.find((l) => l.key === layout)?.hint}</p>
            </div>
            <Field label="Alt text" hint="Describes the image for screen readers and search.">
              <input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={200} className={fieldClass} placeholder="Grafana dashboard showing p95 latency" />
            </Field>
            <Field label={layout === 'side' ? 'Text beside the photo' : layout === 'overlay' ? 'Text on the photo' : 'Caption'} hint="Optional">
              <textarea rows={layout === 'side' ? 5 : 3} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} className={`${fieldClass} resize-y`} />
            </Field>
            <button
              type="button"
              disabled={!selected || !alt.trim()}
              onClick={() => selected && onInsert(figureHtml(selected, layout, alt, text))}
              className="tinted-button w-full justify-center disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" /> Insert into post
            </button>
            {!selected && <p className="text-xs text-muted-foreground">Upload or pick an image first.</p>}
            <button type="button" onClick={onClose} className={`${secondaryButton} w-full justify-center`}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A tiny drawing of each layout, so the choice is visual. */
function LayoutSketch({ layout }: { layout: ImageLayout }) {
  const photo = 'rounded-[3px] bg-primary/50';
  const line = 'h-1 rounded-full bg-foreground/30';
  return (
    <span aria-hidden className="flex h-14 flex-col justify-center gap-1 rounded-lg bg-foreground/[0.04] p-1.5">
      {layout === 'below' && (
        <>
          <span className={`${photo} h-7`} />
          <span className={`${line} w-4/5`} />
        </>
      )}
      {layout === 'overlay' && (
        <span className={`${photo} relative h-full`}>
          <span className="absolute inset-x-1.5 bottom-1.5 h-1 rounded-full bg-white/90" />
          <span className="absolute bottom-3.5 left-1.5 h-1 w-1/2 rounded-full bg-white/70" />
        </span>
      )}
      {layout === 'side' && (
        <span className="flex h-full gap-1.5">
          <span className={`${photo} h-full w-1/2`} />
          <span className="flex w-1/2 flex-col justify-center gap-1">
            <span className={line} />
            <span className={line} />
            <span className={`${line} w-2/3`} />
          </span>
        </span>
      )}
      {layout === 'wide' && (
        <>
          <span className={`${photo} -mx-1 h-6`} />
          <span className={`${line} mx-auto w-1/2`} />
        </>
      )}
    </span>
  );
}
