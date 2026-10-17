import Image from 'next/image';

/**
 * The large portrait behind the hero, shown only in the Midnight look
 * (.portrait-backdrop in globals.css). Desktop: anchored to the top-right of
 * the page, beside the headline. Phones: across the top, above the headline.
 * Decorative: the page already names Madhukar in text.
 */
export function PortraitBackdrop() {
  return (
    <div aria-hidden className="portrait-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
      <div className="portrait-frame">
        <Image
          src="/portrait-cutout.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 720px, 100vw"
          className="object-cover object-[50%_20%]"
        />
      </div>
    </div>
  );
}
