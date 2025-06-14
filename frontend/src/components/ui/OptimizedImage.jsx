import React, { useState, useCallback } from "react";

const OptimizedImage = React.memo(
  ({
    src,
    alt,
    className = "",
    fallbackSrc = "/placeholder-image.jpg",
    loading = "lazy",
    sizes,
    srcSet,
    onLoad,
    onError,
    ...props
  }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

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
        setHasError(true);

        // Try fallback image if not already using it
        if (imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
          return;
        }

        onError?.(event);
      },
      [imageSrc, fallbackSrc, onError]
    );

    // Generate srcSet for responsive images if not provided
    const generateSrcSet = useCallback(
      (baseSrc) => {
        if (srcSet) return srcSet;

        // If the image is from our backend, we can generate different sizes
        if (baseSrc?.includes("/uploads/")) {
          // This would require backend support for different image sizes
          // For now, just return the original
          return undefined;
        }

        return undefined;
      },
      [srcSet]
    );

    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}

        <img
          src={imageSrc}
          alt={alt}
          className={`${className} ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
          loading={loading}
          sizes={sizes}
          srcSet={generateSrcSet(imageSrc)}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />

        {hasError && imageSrc === fallbackSrc && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded">
            <div className="text-gray-400 text-center">
              <svg
                className="w-8 h-8 mx-auto mb-2"
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
              <span className="text-xs">Image not available</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
