import React, { useEffect, useMemo, useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt: string;
  label?: string | null;
  className: string;
  fallbackClassName?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  label,
  className,
  fallbackClassName = "",
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  const initials = useMemo(() => {
    const value = (label || alt || "U").trim();
    const parts = value.split(/\s+/).filter(Boolean);
    return (
      parts
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "U"
    );
  }, [alt, label]);

  if (src && !loadFailed) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} rounded-full object-cover`}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-semibold ${fallbackClassName}`}
      aria-label={alt}
    >
      {initials}
    </div>
  );
};

export default Avatar;
