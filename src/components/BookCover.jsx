import { useState } from "react";
import { getCoverPalette } from "../utils/format.js";

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

export function BookCover({ book }) {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = getCoverPalette(book.isbn || book.title);

  if (book.coverUrl && !imgFailed) {
    return (
      <img
        className="book-cover-img"
        src={book.coverUrl}
        alt={`Cover of ${book.title}`}
        loading="lazy"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <svg
      className="book-cover-svg"
      viewBox="0 0 320 240"
      role="img"
      aria-label={`Generated cover for ${book.title} by ${book.author}`}
    >
      <rect width="320" height="240" fill={palette.bg} />
      <rect width="26" height="240" fill={palette.spine} />
      <rect x="42" y="24" width="254" height="192" fill="none" stroke={palette.accent} strokeOpacity="0.45" strokeWidth="1.5" />
      <text
        x="58"
        y="52"
        fill={palette.accent}
        fontSize="11"
        fontWeight="700"
        letterSpacing="1.6"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {truncate(book.genre.toUpperCase(), 24)}
      </text>
      <text
        x="58"
        y="108"
        fill={palette.text}
        fontSize="21"
        fontWeight="700"
        fontFamily="Fraunces, Georgia, serif"
      >
        {truncate(book.title, 22)}
      </text>
      <text
        x="58"
        y="142"
        fill={palette.text}
        fillOpacity="0.82"
        fontSize="13"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {truncate(book.author, 28)}
      </text>
      <text
        x="58"
        y="196"
        fill={palette.accent}
        fillOpacity="0.9"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        ISBN {book.isbn}
      </text>
    </svg>
  );
}
