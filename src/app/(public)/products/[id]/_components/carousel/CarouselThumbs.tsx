import type { ImageProps } from "next/image";
import { ProductPreviewImage } from "@/components/shared/product/ProductPreviewImage";

type CarouselThumbsProps = {
  selected: boolean;
  onClick: () => void;
  src: ImageProps["src"];
  alt: string;
};

export function CarouselThumbs({
  selected,
  onClick,
  src,
  alt,
}: CarouselThumbsProps) {
  return (
    <div className="embla-thumbs__slide">
      <button
        aria-label={`View ${alt}`}
        aria-pressed={selected}
        onClick={onClick}
        type="button"
        className={`embla-thumbs__slide__button${selected ? " is-selected" : ""}`}
      >
        <span aria-hidden="true" className="embla-thumbs__image-frame">
          <ProductPreviewImage
            src={src}
            fill
            sizes="(max-width: 639px) 22vw, 10vw"
            alt=""
            className="embla-thumbs__image object-contain p-2"
          />
        </span>
      </button>
    </div>
  );
}