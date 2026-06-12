import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg";

interface TransparentLogoProps {
  className?: string;
  sizeClassName?: string;
}

export function TransparentLogo({ className = "", sizeClassName = "h-20 w-20" }: TransparentLogoProps) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const img = new Image();
    img.src = logo;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setSrc(logo);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const w = imgData.width;
      const h = imgData.height;
      const data = imgData.data;

      // Flood fill from the four corners to remove the outer black background
      const visited = new Uint8Array(w * h);
      const queue: [number, number][] = [];

      const add = (x: number, y: number) => {
        const idx = y * w + x;
        if (idx >= 0 && idx < w * h && !visited[idx]) {
          visited[idx] = 1;
          queue.push([x, y]);
        }
      };

      // Push corners
      add(0, 0);
      add(w - 1, 0);
      add(0, h - 1);
      add(w - 1, h - 1);

      // Black threshold (handles compression/anti-aliasing near leaf borders)
      const isBlack = (r: number, g: number, b: number) => r < 35 && g < 35 && b < 35;

      let head = 0;
      while (head < queue.length) {
        const [x, y] = queue[head++];
        const pixelIdx = (y * w + x) * 4;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        if (isBlack(r, g, b)) {
          data[pixelIdx + 3] = 0; // Set alpha to 0 (fully transparent)

          // Add 4-way neighbors
          if (x > 0) add(x - 1, y);
          if (x < w - 1) add(x + 1, y);
          if (y > 0) add(x, y - 1);
          if (y < h - 1) add(x, y + 1);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      try {
        setSrc(canvas.toDataURL("image/png"));
      } catch (e) {
        setSrc(logo); // Fallback if security restrictions block toDataURL
      }
    };

    img.onerror = () => {
      setSrc(logo);
    };
  }, []);

  if (!src) {
    // Return a placeholder structure with the target dimensions to avoid cumulative layout shift
    return <div className={`${sizeClassName} bg-transparent rounded-full animate-pulse`} />;
  }

  return (
    <img
      src={src}
      alt="Saanjh Logo"
      loading="eager"
      className={`${sizeClassName} object-contain ${className}`}
    />
  );
}
