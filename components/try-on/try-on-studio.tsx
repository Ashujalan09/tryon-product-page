"use client";

import {
  Camera,
  Check,
  Crop,
  Download,
  ImagePlus,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { formatInr, type Product } from "@/lib/catalog";
import {
  clamp,
  type CropTransform,
  DEFAULT_CROP_TRANSFORM,
  getImageFrameLayout,
  getSlotAspect,
  loadImageElement,
  renderCroppedImage,
  type UploadedImage,
} from "@/lib/image-crop";

const MAX_FILES = 5;
const MAX_BYTES = 12 * 1024 * 1024;

interface TryOnStudioProps {
  onApply: (images: UploadedImage[]) => void;
  onClose: () => void;
  open: boolean;
  product: Product;
  userImages: UploadedImage[];
}

function hasCustomTransform(transform: CropTransform): boolean {
  return transform.scale !== 1 || transform.offsetX !== 0 || transform.offsetY !== 0;
}

export function TryOnStudio({
  onApply,
  onClose,
  open,
  product,
  userImages,
}: TryOnStudioProps) {
  const [drafts, setDrafts] = useState<UploadedImage[]>(userImages);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragItem, setDragItem] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [cropDraft, setCropDraft] = useState<CropTransform>(DEFAULT_CROP_TRANSFORM);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const created = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setDrafts(userImages);
    setError(null);
    setEditingIndex(null);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open, userImages]);

  async function accept(list: FileList | null) {
    if (!list?.length) return;
    const files = Array.from(list);
    const pendingUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Some files were skipped — use JPG, PNG, WebP or HEIC images.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError("Some files were skipped — each image must be under 12 MB.");
        continue;
      }
      if (drafts.length + pendingUrls.length >= MAX_FILES) break;
      const url = URL.createObjectURL(file);
      created.current.add(url);
      pendingUrls.push(url);
    }

    if (pendingUrls.length === 0) return;

    const accepted: UploadedImage[] = await Promise.all(
      pendingUrls.map(async (url) => {
        try {
          const img = await loadImageElement(url);
          return {
            id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : url,
            originalUrl: url,
            croppedUrl: url,
            naturalWidth: img.naturalWidth || 1,
            naturalHeight: img.naturalHeight || 1,
            transform: DEFAULT_CROP_TRANSFORM,
          };
        } catch {
          return {
            id: url,
            originalUrl: url,
            croppedUrl: url,
            naturalWidth: 1,
            naturalHeight: 1,
            transform: DEFAULT_CROP_TRANSFORM,
          };
        }
      }),
    );

    setDrafts((current) => [...current, ...accepted].slice(0, MAX_FILES));
    setError(null);
  }

  async function rebakeMovedSlots(previous: UploadedImage[], next: UploadedImage[]) {
    const updated = await Promise.all(
      next.map(async (item, newIndex) => {
        const oldIndex = previous.findIndex((entry) => entry.id === item.id);
        const wasHero = oldIndex === 0;
        const isHero = newIndex === 0;
        if (wasHero === isHero || !hasCustomTransform(item.transform)) return item;
        const croppedUrl = await renderCroppedImage(
          item.originalUrl,
          item.transform,
          getSlotAspect(newIndex),
        );
        if (croppedUrl !== item.originalUrl) created.current.add(croppedUrl);
        return { ...item, croppedUrl };
      }),
    );
    setDrafts(updated);
  }

  function remove(index: number) {
    if (editingIndex !== null) setEditingIndex(null);
    setDrafts((current) => current.filter((_, entryIndex) => entryIndex !== index));
  }

  function move(index: number, direction: -1 | 1) {
    if (editingIndex !== null) setEditingIndex(null);
    const target = index + direction;
    if (target < 0 || target >= drafts.length) return;
    const next = [...drafts];
    [next[index], next[target]] = [next[target], next[index]];
    setDrafts(next);
    void rebakeMovedSlots(drafts, next);
  }

  function makeHero(index: number) {
    if (index === 0) return;
    if (editingIndex !== null) setEditingIndex(null);
    const next = [...drafts];
    const [item] = next.splice(index, 1);
    const reordered = [item, ...next];
    setDrafts(reordered);
    void rebakeMovedSlots(drafts, reordered);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    if (editingIndex !== null) setEditingIndex(null);
    const next = [...drafts];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDrafts(next);
    void rebakeMovedSlots(drafts, next);
  }

  function startCrop(index: number) {
    const item = drafts[index];
    if (!item) return;
    setEditingIndex(index);
    setCropDraft(item.transform);
  }

  function cancelCrop() {
    setEditingIndex(null);
  }

  async function applyCrop() {
    if (editingIndex === null) return;
    const item = drafts[editingIndex];
    if (!item) return;

    setIsApplyingCrop(true);
    try {
      let nextCroppedUrl = item.originalUrl;
      if (hasCustomTransform(cropDraft)) {
        nextCroppedUrl = await renderCroppedImage(
          item.originalUrl,
          cropDraft,
          getSlotAspect(editingIndex),
        );
        if (nextCroppedUrl !== item.originalUrl) {
          created.current.add(nextCroppedUrl);
        }
      }
      setDrafts((current) =>
        current.map((entry, idx) =>
          idx === editingIndex ? { ...entry, croppedUrl: nextCroppedUrl, transform: cropDraft } : entry,
        ),
      );
      setEditingIndex(null);
    } finally {
      setIsApplyingCrop(false);
    }
  }

  function clearAll() {
    for (const item of drafts) {
      if (created.current.has(item.originalUrl)) URL.revokeObjectURL(item.originalUrl);
      if (created.current.has(item.croppedUrl)) URL.revokeObjectURL(item.croppedUrl);
    }
    setDrafts([]);
    setEditingIndex(null);
    setError(null);
  }

  function apply() {
    const activeUrls = new Set<string>();
    for (const item of drafts) {
      activeUrls.add(item.originalUrl);
      activeUrls.add(item.croppedUrl);
    }
    for (const url of created.current) {
      if (!activeUrls.has(url)) URL.revokeObjectURL(url);
    }
    onApply(drafts);
    onClose();
  }

  if (!open) return null;

  const [first] = drafts;
  const editingItem = editingIndex !== null ? drafts[editingIndex] : null;


  return (
    <div className="fixed inset-0 z-(--z-overlay) flex items-stretch justify-center desktop:items-center">
      <button
        aria-label="Close image studio"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={onClose}
        type="button"
      />
      <div
        aria-label="Upload your images"
        aria-modal="true"
        className="relative flex h-full w-full flex-col overflow-y-auto bg-paper desktop:h-auto desktop:max-h-[92dvh] desktop:max-w-[1040px] desktop:flex-row desktop:overflow-hidden"
        role="dialog"
      >
        {/* Preview */}
        <div className="relative flex flex-col bg-surface desktop:min-h-0 desktop:flex-1">
          <div className="flex shrink-0 items-center justify-between border-b border-rule px-5 py-3 desktop:hidden">
            <p className="type-label">Upload your images</p>
            <button
              aria-label="Close"
              className="focus-ring flex size-8 items-center justify-center"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" strokeWidth={1.25} />
            </button>
          </div>

          <div className="relative flex flex-col items-center p-5 desktop:min-h-0 desktop:flex-1 desktop:overflow-y-auto desktop:p-8">
            <div className="my-auto flex w-full flex-col items-center gap-3">
            {editingItem && editingIndex !== null ? (
              (() => {
                const frameAspect = getSlotAspect(editingIndex);
                const layout = getImageFrameLayout(
                  editingItem.naturalWidth,
                  editingItem.naturalHeight,
                  frameAspect,
                  cropDraft,
                );
                return (
                  <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
                    <div className="flex w-full items-center justify-between">
                      <p className="type-label text-ink">
                        Adjust crop &amp; scale · {editingIndex === 0 ? "Hero" : `Gallery ${editingIndex + 1}`}
                      </p>
                      <button
                        className="type-label focus-ring flex items-center gap-1 text-ink-muted hover:text-ink"
                        onClick={() => setCropDraft(DEFAULT_CROP_TRANSFORM)}
                        type="button"
                      >
                        <RotateCcw className="size-3" strokeWidth={1.25} />
                        Reset
                      </button>
                    </div>

                    <div
                      className={`relative w-full overflow-hidden bg-paper shadow-modal select-none touch-none cursor-grab active:cursor-grabbing ${
                        editingIndex === 0
                          ? "max-w-[300px] aspect-[800/1432]"
                          : "max-w-[360px] aspect-[3/4]"
                      }`}
                      onPointerCancel={() => {
                        dragStartRef.current = null;
                      }}
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragStartRef.current = {
                          pointerId: event.pointerId,
                          clientX: event.clientX,
                          clientY: event.clientY,
                          offsetX: cropDraft.offsetX,
                          offsetY: cropDraft.offsetY,
                        };
                      }}
                      onPointerMove={(event) => {
                        const start = dragStartRef.current;
                        const frame = cropFrameRef.current;
                        if (!start || start.pointerId !== event.pointerId || !frame) return;

                        const rect = frame.getBoundingClientRect();
                        const dx = event.clientX - start.clientX;
                        const dy = event.clientY - start.clientY;

                        const maxPxX = rect.width * (layout.maxOffsetXPct / 100);
                        const maxPxY = rect.height * (layout.maxOffsetYPct / 100);

                        setCropDraft((prev) => ({
                          ...prev,
                          offsetX: maxPxX > 0 ? clamp(start.offsetX + dx / maxPxX, -1, 1) : 0,
                          offsetY: maxPxY > 0 ? clamp(start.offsetY + dy / maxPxY, -1, 1) : 0,
                        }));
                      }}
                      onPointerUp={(event) => {
                        if (dragStartRef.current?.pointerId === event.pointerId) {
                          dragStartRef.current = null;
                        }
                      }}
                      onWheel={(event) => {
                        event.preventDefault();
                        setCropDraft((prev) => ({
                          ...prev,
                          scale: clamp(Number((prev.scale - event.deltaY * 0.002).toFixed(2)), 1, 3),
                        }));
                      }}
                      ref={cropFrameRef}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Adjust crop and scale"
                        className="pointer-events-none absolute max-w-none"
                        draggable={false}
                        src={editingItem.originalUrl}
                        style={{
                          width: `${layout.widthPct}%`,
                          height: `${layout.heightPct}%`,
                          left: `${layout.leftPct}%`,
                          top: `${layout.topPct}%`,
                        }}
                      />
                      {/* Rule-of-thirds overlay */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/40"
                      >
                        <span className="border-r border-b border-white/25" />
                        <span className="border-r border-b border-white/25" />
                        <span className="border-b border-white/25" />
                        <span className="border-r border-b border-white/25" />
                        <span className="border-r border-b border-white/25" />
                        <span className="border-b border-white/25" />
                        <span className="border-r border-white/25" />
                        <span className="border-r border-white/25" />
                        <span />
                      </div>
                    </div>

                    <div className="grid w-full gap-2 border border-rule bg-paper p-3">
                      <div className="flex items-center gap-3">
                        <button
                          aria-label="Zoom out"
                          className="focus-ring flex size-7 shrink-0 items-center justify-center border border-rule text-ink disabled:opacity-35"
                          disabled={cropDraft.scale <= 1}
                          onClick={() =>
                            setCropDraft((prev) => ({
                              ...prev,
                              scale: clamp(Number((prev.scale - 0.1).toFixed(2)), 1, 3),
                            }))
                          }
                          type="button"
                        >
                          <Minus className="size-3.5" strokeWidth={1.25} />
                        </button>
                        <input
                          aria-label="Scale image"
                          className="h-1 flex-1 cursor-pointer accent-ink"
                          max={3}
                          min={1}
                          onChange={(event) =>
                            setCropDraft((prev) => ({
                              ...prev,
                              scale: Number(event.target.value),
                            }))
                          }
                          step={0.05}
                          type="range"
                          value={cropDraft.scale}
                        />
                        <button
                          aria-label="Zoom in"
                          className="focus-ring flex size-7 shrink-0 items-center justify-center border border-rule text-ink disabled:opacity-35"
                          disabled={cropDraft.scale >= 3}
                          onClick={() =>
                            setCropDraft((prev) => ({
                              ...prev,
                              scale: clamp(Number((prev.scale + 0.1).toFixed(2)), 1, 3),
                            }))
                          }
                          type="button"
                        >
                          <Plus className="size-3.5" strokeWidth={1.25} />
                        </button>
                        <span className="type-label w-10 shrink-0 text-right tabular-nums text-ink">
                          {Math.round(cropDraft.scale * 100)}%
                        </span>
                      </div>
                      <p className="type-label text-center text-ink-muted">
                        Drag inside the frame to reposition · Scroll or slide to scale
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : first ? (
              <>
                <figure className="relative aspect-[800/1432] w-full max-w-[340px] overflow-hidden bg-paper shadow-modal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Your uploaded image, enlarged"
                    className="h-full w-full object-cover"
                    src={first.croppedUrl}
                  />
                  <span className="type-label absolute top-3 left-3 bg-paper px-2 py-1">
                    Your image · enlarged
                  </span>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      aria-label="Crop and scale enlarged image"
                      className="type-label flex h-8 items-center gap-1 bg-paper/90 px-2.5 text-ink transition-colors hover:bg-ink hover:text-inverse"
                      onClick={() => startCrop(0)}
                      type="button"
                    >
                      <Crop className="size-3.5" strokeWidth={1.25} />
                      Crop
                    </button>
                    <button
                      aria-label="Remove enlarged image"
                      className="flex size-8 items-center justify-center bg-paper/90 text-ink transition-colors hover:bg-ink hover:text-inverse"
                      onClick={() => remove(0)}
                      type="button"
                    >
                      <X className="size-4" strokeWidth={1.25} />
                    </button>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 to-transparent p-4 text-inverse">
                    <div className="grid gap-0.5">
                      <p className="type-label">Lorem Ipsum · {product.colorName}</p>
                      <p className="pdp-title !text-inverse">{product.title}</p>
                    </div>
                    <p className="pdp-price !text-inverse">{formatInr(product.price)}</p>
                  </div>
                </figure>

                {drafts.length > 1 ? (
                  <div className="grid w-full max-w-[420px] grid-cols-2 gap-2">
                    {drafts.slice(1).map((item, index) => (
                      <figure className="relative aspect-[3/4] overflow-hidden bg-paper" key={item.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={`Your uploaded image ${index + 2}`}
                          className="h-full w-full object-cover"
                          src={item.croppedUrl}
                        />
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                          <button
                            aria-label={`Crop and scale image ${index + 2}`}
                            className="flex size-6 items-center justify-center bg-paper/90 text-ink transition-colors hover:bg-ink hover:text-inverse"
                            onClick={() => startCrop(index + 1)}
                            type="button"
                          >
                            <Crop className="size-3" strokeWidth={1.25} />
                          </button>
                          <button
                            aria-label={`Remove image ${index + 2}`}
                            className="flex size-6 items-center justify-center bg-paper/90 text-ink transition-colors hover:bg-ink hover:text-inverse"
                            onClick={() => remove(index + 1)}
                            type="button"
                          >
                            <X className="size-3" strokeWidth={1.25} />
                          </button>
                        </div>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div
                className={`grid w-full max-w-[420px] justify-items-center gap-5 border border-dashed p-8 text-center transition-colors ${
                  dragging ? "border-ink bg-paper" : "border-input bg-paper/60"
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  accept(event.dataTransfer.files);
                }}
              >
                <span className="flex size-14 items-center justify-center border border-rule bg-paper">
                  <ImagePlus className="size-6" strokeWidth={1} />
                </span>
                <div className="grid gap-2">
                  <p className="type-h3">Add your images</p>
                  <p className="type-body-sm max-w-[36ch] text-ink-muted">
                    The first image is shown enlarged on the product page. Up to four more sit
                    two-up in the gallery, exactly like the design.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    className="type-control flex h-10 items-center gap-2 bg-ink px-5 uppercase text-inverse focus-ring"
                    onClick={() => fileRef.current?.click()}
                    type="button"
                  >
                    <ImagePlus className="size-4" strokeWidth={1.25} />
                    Choose images
                  </button>
                  <button
                    className="type-control flex h-10 items-center gap-2 border border-ink px-5 uppercase focus-ring"
                    onClick={() => cameraRef.current?.click()}
                    type="button"
                  >
                    <Camera className="size-4" strokeWidth={1.25} />
                    Camera
                  </button>
                </div>
                <p className="type-label text-ink-muted">
                  JPG, PNG or WebP · up to 12 MB · {MAX_FILES} images max
                </p>
              </div>
            )}
            </div>
          </div>

          {editingItem ? (
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-rule bg-paper px-5 py-4">
              <button
                className="type-control flex h-9 items-center gap-2 border border-rule px-4 uppercase text-ink-muted focus-ring hover:border-ink hover:text-ink"
                onClick={cancelCrop}
                type="button"
              >
                Cancel
              </button>
              <button
                className="type-control flex h-9 items-center gap-2 border border-ink px-4 uppercase focus-ring"
                onClick={() => setCropDraft(DEFAULT_CROP_TRANSFORM)}
                type="button"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.25} />
                Reset
              </button>
              <button
                className="type-control flex h-9 items-center gap-2 bg-ink px-5 uppercase text-inverse focus-ring disabled:opacity-50"
                disabled={isApplyingCrop}
                onClick={() => void applyCrop()}
                type="button"
              >
                <Check className="size-3.5" strokeWidth={1.5} />
                {isApplyingCrop ? "Applying…" : "Apply crop"}
              </button>
            </div>
          ) : first ? (
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-rule bg-paper px-5 py-4">
              <button
                className="type-control flex h-9 items-center gap-2 border border-ink px-4 uppercase focus-ring"
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                <ImagePlus className="size-3.5" strokeWidth={1.25} />
                Add more
              </button>
              <a
                className="type-control flex h-9 items-center gap-2 border border-ink px-4 uppercase focus-ring"
                download="lorem-ipsum-image"
                href={first.croppedUrl}
              >
                <Download className="size-3.5" strokeWidth={1.25} />
                Save
              </a>
              <button
                className="type-control flex h-9 items-center gap-2 border border-rule px-4 uppercase text-ink-muted focus-ring"
                onClick={clearAll}
                type="button"
              >
                <Trash2 className="size-3.5" strokeWidth={1.25} />
                Clear all
              </button>
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex w-full shrink-0 flex-col desktop:min-h-0 desktop:w-[360px] desktop:border-l desktop:border-rule">
          <div className="hidden shrink-0 items-center justify-between border-b border-rule px-6 py-4 desktop:flex">
            <p className="type-label">Upload your images</p>
            <button
              aria-label="Close image studio"
              className="focus-ring flex size-8 items-center justify-center"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" strokeWidth={1.25} />
            </button>
          </div>

          <div className="grid flex-1 content-start gap-6 p-6 desktop:min-h-0 desktop:overflow-y-auto">
            <div className="grid gap-2">
              <p className="type-label text-ink-muted">01 — Add your images</p>
              <p className="pdp-copy text-ink-muted">
                Upload the images you want to see on the product page. The first becomes the
                enlarged hero; the rest are placed two per row beneath it.
              </p>
            </div>

            <div className="border border-rule p-4">
              <div className="flex items-center gap-3">
                <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-surface">
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={first?.croppedUrl ?? product.images[0].src}
                  />
                </div>
                <div className="min-w-0">
                  <p className="pdp-label truncate">{product.title}</p>
                  <p className="type-label text-ink-muted">
                    {product.colorName} · {formatInr(product.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-baseline justify-between">
                <p className="type-label text-ink-muted">Your gallery</p>
                <p className="type-label text-ink-muted tabular-nums">
                  {drafts.length} / {MAX_FILES}
                </p>
              </div>

              {drafts.length > 0 ? (
                <ul className="divide-y divide-rule border border-rule" role="list">
                  {drafts.map((item, index) => (
                    <li
                      className={`flex items-center gap-2 px-2 py-2 ${
                        editingIndex === index ? "bg-surface" : "bg-paper"
                      }`}
                      draggable
                      key={item.id}
                      onDragOver={(event) => event.preventDefault()}
                      onDragStart={() => setDragItem(index)}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (dragItem !== null) reorder(dragItem, index);
                        setDragItem(null);
                      }}
                    >
                      <span className="type-label w-4 shrink-0 text-ink-muted tabular-nums">
                        {index + 1}
                      </span>
                      <span className="relative h-10 w-8 shrink-0 overflow-hidden bg-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" className="h-full w-full object-cover" src={item.croppedUrl} />
                      </span>
                      <span className="type-label min-w-0 flex-1 truncate">
                        {index === 0 ? "Hero · enlarged" : `Gallery · two-up`}
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <button
                          aria-label={`Crop and scale image ${index + 1}`}
                          className={`focus-ring flex size-7 items-center justify-center transition-colors ${
                            editingIndex === index
                              ? "bg-ink text-inverse"
                              : "text-ink-muted hover:text-ink"
                          }`}
                          onClick={() => startCrop(index)}
                          title="Crop & scale"
                          type="button"
                        >
                          <Crop className="size-3.5" strokeWidth={1.25} />
                        </button>
                        <button
                          aria-label={`Move image ${index + 1} up`}
                          className="focus-ring flex size-7 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Move image ${index + 1} down`}
                          className="focus-ring flex size-7 items-center justify-center text-ink-muted hover:text-ink disabled:opacity-30"
                          disabled={index === drafts.length - 1}
                          onClick={() => move(index, 1)}
                          type="button"
                        >
                          ↓
                        </button>
                        {index > 0 ? (
                          <button
                            aria-label={`Make image ${index + 1} the hero`}
                            className="type-label focus-ring ml-1 border border-rule px-1.5 py-1 text-ink-muted hover:border-ink hover:text-ink"
                            onClick={() => makeHero(index)}
                            type="button"
                          >
                            Hero
                          </button>
                        ) : null}
                        <button
                          aria-label={`Remove image ${index + 1}`}
                          className="focus-ring flex size-7 items-center justify-center text-ink-muted hover:text-ink"
                          onClick={() => remove(index)}
                          type="button"
                        >
                          <X className="size-3.5" strokeWidth={1.25} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <button
                  className="grid place-items-center gap-1 border border-dashed border-input py-5 text-ink-muted"
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  <ImagePlus className="size-4" strokeWidth={1.25} />
                  <span className="type-label">Add up to 5 at once</span>
                </button>
              )}

              <p className="type-label text-ink-muted">
                Drag a row to reorder, use ↑ ↓, or promote any image to the enlarged hero.
              </p>
            </div>

            {error ? (
              <p className="type-body-sm border border-error-rule bg-error-soft p-3 text-error-rule">
                {error}
              </p>
            ) : null}

            <div className="mt-auto flex items-start gap-2 border-t border-rule pt-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.25} />
              <p className="type-label text-ink-muted">
                Private by design. Your images stay in this browser — nothing is uploaded to a
                server.
              </p>
            </div>
          </div>

          <div className="grid shrink-0 gap-2 border-t border-rule bg-paper p-6">
            <p className="type-label text-ink-muted">02 — Place them on the page</p>
            <button
              className="type-control flex h-11 w-full items-center justify-center gap-2 bg-ink uppercase text-inverse focus-ring disabled:cursor-not-allowed disabled:bg-input disabled:text-ink-muted"
              disabled={drafts.length === 0}
              onClick={apply}
              type="button"
            >
              <Check className="size-4" strokeWidth={1.5} />
              Add {drafts.length || ""} image{drafts.length === 1 ? "" : "s"} to the page
            </button>
            {userImages.length > 0 ? (
              <button
                className="type-control h-9 w-full border border-rule text-ink-muted uppercase focus-ring"
                onClick={() => {
                  onApply([]);
                  onClose();
                }}
                type="button"
              >
                Reset to product photos
              </button>
            ) : null}
          </div>
        </div>

        <input
          accept="image/*"
          className="sr-only"
          multiple
          onChange={(event) => {
            accept(event.target.files);
            event.target.value = "";
          }}
          ref={fileRef}
          type="file"
        />
        <input
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            accept(event.target.files);
            event.target.value = "";
          }}
          ref={cameraRef}
          type="file"
        />
      </div>
    </div>
  );
}
