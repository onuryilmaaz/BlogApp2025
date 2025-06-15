import React, { useState, useCallback, useEffect, useMemo } from "react";

// Image variant configurations matching backend
const IMAGE_VARIANTS = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  hero: { width: 1920, height: 1080 },
  avatar: { width: 200, height: 200 },
  cover: { width: 1200, height: 630 },
};

// Modern image formats in order of preference
const SUPPORTED_FORMATS = ["avif", "webp", "jpeg"];

const OptimizedImage = React.memo(
  ({
    src,
    alt,
    className = "",
    fallbackSrc = "/placeholder-image.jpg",
    loading = "lazy",
    sizes,
    srcSet,
    variant = "medium",
    priority = false,
    onLoad,
    onError,
    enableWebP = true,
    enableAVIF = true,
    ...props
  }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentFormat, setCurrentFormat] = useState("jpeg");

    // Detect browser support for modern formats
    const browserSupport = useMemo(() => {
      if (typeof window === "undefined") return { webp: false, avif: false };

      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;

      return {
        webp:
          enableWebP &&
          canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0,
        avif:
          enableAVIF &&
          canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0,
      };
    }, [enableWebP, enableAVIF]);

    // Generate optimized image URLs
    const generateOptimizedUrl = useCallback((baseSrc, format, variantName) => {
      if (!baseSrc || !baseSrc.includes("/uploads/")) return baseSrc;

      // For now, just return the original image URL since optimization is not fully implemented
      return baseSrc;
    }, []);

    // Generate srcSet for responsive images
    const generateSrcSet = useCallback(
      (baseSrc) => {
        if (srcSet) return srcSet;
        if (!baseSrc || !baseSrc.includes("/uploads/")) return "";

        const variants = ["thumbnail", "small", "medium", "large"];
        const format = browserSupport.avif
          ? "avif"
          : browserSupport.webp
          ? "webp"
          : "jpeg";

        return variants
          .map((v) => {
            const config = IMAGE_VARIANTS[v];
            const url = generateOptimizedUrl(baseSrc, format, v);
            return `${url} ${config.width}w`;
          })
          .join(", ");
      },
      [srcSet, browserSupport, generateOptimizedUrl]
    );

    // Get the best format for current browser
    const getBestFormat = useCallback(() => {
      if (browserSupport.avif) return "avif";
      if (browserSupport.webp) return "webp";
      return "jpeg";
    }, [browserSupport]);

    // Update image source when src or browser support changes
    useEffect(() => {
      if (!src) return;

      const bestFormat = getBestFormat();
      setCurrentFormat(bestFormat);

      if (src.includes("/uploads/")) {
        const optimizedSrc = generateOptimizedUrl(src, bestFormat, variant);
        setImageSrc(optimizedSrc);
      } else {
        setImageSrc(src);
      }
    }, [src, variant, getBestFormat, generateOptimizedUrl]);

    const handleLoad = useCallback(
      (event) => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.(event);
      },
      [onLoad]
    );

    const handleError = useCallback(
      (event) => {
        setIsLoading(false);

        // Try fallback formats in order
        if (currentFormat === "avif" && browserSupport.webp) {
          const webpSrc = generateOptimizedUrl(src, "webp", variant);
          setCurrentFormat("webp");
          setImageSrc(webpSrc);
          return;
        }

        if (currentFormat === "avif" || currentFormat === "webp") {
          const jpegSrc = generateOptimizedUrl(src, "jpeg", variant);
          setCurrentFormat("jpeg");
          setImageSrc(jpegSrc);
          return;
        }

        // Try original image
        if (imageSrc !== src && src) {
          setImageSrc(src);
          return;
        }

        // Finally try fallback
        if (imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
          setHasError(true);
          return;
        }

        setHasError(true);
        onError?.(event);
      },
      [
        imageSrc,
        src,
        fallbackSrc,
        currentFormat,
        variant,
        browserSupport,
        generateOptimizedUrl,
        onError,
      ]
    );

    // Generate sizes attribute for responsive images
    const responsiveSizes = useMemo(() => {
      if (sizes) return sizes;

      // Default responsive sizes based on variant
      switch (variant) {
        case "thumbnail":
          return "150px";
        case "small":
          return "(max-width: 640px) 100vw, 300px";
        case "medium":
          return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px";
        case "large":
          return "(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 1200px";
        case "hero":
          return "100vw";
        case "avatar":
          return "200px";
        case "cover":
          return "(max-width: 640px) 100vw, 1200px";
        default:
          return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px";
      }
    }, [sizes, variant]);

    // Preload critical images
    useEffect(() => {
      if (priority && imageSrc) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = imageSrc;
        if (generateSrcSet(imageSrc)) {
          link.imageSrcset = generateSrcSet(imageSrc);
          link.imageSizes = responsiveSizes;
        }
        document.head.appendChild(link);

        return () => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        };
      }
    }, [priority, imageSrc, generateSrcSet, responsiveSizes]);

    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Loading placeholder */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>
        )}

        {/* Main image */}
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100"
          } ${hasError ? "filter grayscale" : ""}`}
          loading={priority ? "eager" : loading}
          sizes={responsiveSizes}
          srcSet={generateSrcSet(imageSrc)}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          {...props}
        />

        {/* Error state */}
        {hasError && imageSrc === fallbackSrc && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded">
            <div className="text-gray-400 text-center p-4">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium">Image unavailable</p>
              <p className="text-xs opacity-75 mt-1">Failed to load image</p>
            </div>
          </div>
        )}

        {/* Format indicator (development only) */}
        {import.meta.env.MODE === "development" && !isLoading && !hasError && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {currentFormat.toUpperCase()}
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
