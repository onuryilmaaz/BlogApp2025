/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// SEO Utilities for Blog Application
import { Helmet } from "react-helmet-async";

// Default SEO configuration
export const DEFAULT_SEO = {
  title: "Modern Blog - Latest Articles & Insights",
  description:
    "Discover the latest articles, insights, and stories on our modern blog platform. Stay updated with trending topics and expert opinions.",
  keywords: "blog, articles, insights, technology, lifestyle, news",
  author: "Modern Blog Team",
  image: "/og-default.jpg",
  url: typeof window !== "undefined" ? window.location.origin : "",
  type: "website",
  locale: "en_US",
  siteName: "Modern Blog",
  twitterHandle: "@modernblog",
};

// Generate SEO meta tags for blog posts
export const generatePostSEO = (post) => {
  if (!post) return DEFAULT_SEO;

  const title = `${post.title} | Modern Blog`;
  const description =
    post.excerpt ||
    post.content?.substring(0, 160).replace(/<[^>]*>/g, "") ||
    DEFAULT_SEO.description;
  const image = post.featuredImage || DEFAULT_SEO.image;
  const url = `${DEFAULT_SEO.url}/${post.slug}`;
  const publishedTime = post.createdAt;
  const modifiedTime = post.updatedAt;
  const tags = post.tags?.join(", ") || "";
  const author = post.author?.name || DEFAULT_SEO.author;

  return {
    title,
    description,
    keywords: `${tags}, ${DEFAULT_SEO.keywords}`,
    author,
    image,
    url,
    type: "article",
    locale: DEFAULT_SEO.locale,
    siteName: DEFAULT_SEO.siteName,
    publishedTime,
    modifiedTime,
    tags: post.tags || [],
    category: post.category || "General",
    readingTime: calculateReadingTime(post.content),
  };
};

// Generate SEO meta tags for tag pages
export const generateTagSEO = (tagName, posts = []) => {
  const title = `${tagName} Articles | Modern Blog`;
  const description = `Explore all articles tagged with "${tagName}". Find the latest insights and stories related to ${tagName}.`;
  const url = `${DEFAULT_SEO.url}/tag/${tagName}`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    keywords: `${tagName}, ${DEFAULT_SEO.keywords}`,
    url,
    type: "website",
  };
};

// Generate SEO meta tags for search results
export const generateSearchSEO = (query, results = []) => {
  const title = `Search Results for "${query}" | Modern Blog`;
  const description = `Found ${results.length} articles matching "${query}". Discover relevant content and insights.`;
  const url = `${DEFAULT_SEO.url}/search?q=${encodeURIComponent(query)}`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    keywords: `${query}, search, ${DEFAULT_SEO.keywords}`,
    url,
    type: "website",
  };
};

// Calculate reading time
export const calculateReadingTime = (content) => {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Generate structured data (JSON-LD) for blog posts
export const generateArticleStructuredData = (post, seoData) => {
  if (!post) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: seoData.description,
    image: seoData.image,
    author: {
      "@type": "Person",
      name: seoData.author,
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SEO.url}/logo.png`,
      },
    },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": seoData.url,
    },
    keywords: post.tags?.join(", "),
    articleSection: post.category,
    wordCount: post.content?.replace(/<[^>]*>/g, "").split(/\s+/).length,
    timeRequired: `PT${seoData.readingTime}M`,
  };
};

// Generate structured data for website
export const generateWebsiteStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.url,
    description: DEFAULT_SEO.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DEFAULT_SEO.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
};

// Generate structured data for blog
export const generateBlogStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.url,
    description: DEFAULT_SEO.description,
    author: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SEO.url}/logo.png`,
      },
    },
  };
};

// Generate breadcrumb structured data
export const generateBreadcrumbStructuredData = (breadcrumbs) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
};

// SEO optimization recommendations
export const getSEORecommendations = (seoData) => {
  const recommendations = [];

  // Title length check
  if (seoData.title.length < 30) {
    recommendations.push({
      type: "warning",
      message: "Title is too short. Consider making it 30-60 characters.",
      field: "title",
    });
  } else if (seoData.title.length > 60) {
    recommendations.push({
      type: "warning",
      message:
        "Title is too long. Keep it under 60 characters for better display.",
      field: "title",
    });
  }

  // Description length check
  if (seoData.description.length < 120) {
    recommendations.push({
      type: "warning",
      message: "Description is too short. Aim for 120-160 characters.",
      field: "description",
    });
  } else if (seoData.description.length > 160) {
    recommendations.push({
      type: "warning",
      message: "Description is too long. Keep it under 160 characters.",
      field: "description",
    });
  }

  // Keywords check
  if (!seoData.keywords || seoData.keywords.length < 10) {
    recommendations.push({
      type: "info",
      message: "Consider adding more relevant keywords.",
      field: "keywords",
    });
  }

  // Image check
  if (!seoData.image || seoData.image === DEFAULT_SEO.image) {
    recommendations.push({
      type: "info",
      message:
        "Consider adding a custom featured image for better social sharing.",
      field: "image",
    });
  }

  return recommendations;
};

// Generate sitemap data
export const generateSitemapData = (posts, tags) => {
  const urls = [];

  // Homepage
  urls.push({
    loc: DEFAULT_SEO.url,
    lastmod: new Date().toISOString(),
    changefreq: "daily",
    priority: "1.0",
  });

  // Posts
  posts.forEach((post) => {
    urls.push({
      loc: `${DEFAULT_SEO.url}/${post.slug}`,
      lastmod: post.updatedAt,
      changefreq: "weekly",
      priority: "0.8",
    });
  });

  // Tag pages
  tags.forEach((tag) => {
    urls.push({
      loc: `${DEFAULT_SEO.url}/tag/${tag.name}`,
      lastmod: tag.lastUsed || new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.6",
    });
  });

  // Static pages
  const staticPages = [
    { path: "/search", priority: "0.5" },
    { path: "/about", priority: "0.5" },
    { path: "/contact", priority: "0.5" },
  ];

  staticPages.forEach((page) => {
    urls.push({
      loc: `${DEFAULT_SEO.url}${page.path}`,
      lastmod: new Date().toISOString(),
      changefreq: "monthly",
      priority: page.priority,
    });
  });

  return urls;
};

// Generate robots.txt content
export const generateRobotsTxt = () => {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${DEFAULT_SEO.url}/sitemap.xml

# Disallow admin pages
Disallow: /admin/
Disallow: /admin-login

# Disallow API endpoints
Disallow: /api/

# Allow search engines to crawl images
Allow: /uploads/

# Crawl delay
Crawl-delay: 1`;
};

// URL optimization utilities
export const optimizeUrl = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
};

// Meta tag validation
export const validateMetaTags = (seoData) => {
  const errors = [];

  if (!seoData.title) {
    errors.push("Title is required");
  }

  if (!seoData.description) {
    errors.push("Description is required");
  }

  if (!seoData.url) {
    errors.push("URL is required");
  }

  if (seoData.title && seoData.title.length > 60) {
    errors.push("Title should be 60 characters or less");
  }

  if (seoData.description && seoData.description.length > 160) {
    errors.push("Description should be 160 characters or less");
  }

  return errors;
};

// Social media optimization
export const generateSocialTags = (seoData) => {
  return {
    // Open Graph
    "og:title": seoData.title,
    "og:description": seoData.description,
    "og:image": seoData.image,
    "og:url": seoData.url,
    "og:type": seoData.type,
    "og:locale": seoData.locale,
    "og:site_name": seoData.siteName,
    ...(seoData.publishedTime && {
      "article:published_time": seoData.publishedTime,
    }),
    ...(seoData.modifiedTime && {
      "article:modified_time": seoData.modifiedTime,
    }),
    ...(seoData.tags && { "article:tag": seoData.tags }),
    ...(seoData.category && { "article:section": seoData.category }),

    // Twitter
    "twitter:card": "summary_large_image",
    "twitter:site": DEFAULT_SEO.twitterHandle,
    "twitter:title": seoData.title,
    "twitter:description": seoData.description,
    "twitter:image": seoData.image,
    "twitter:url": seoData.url,
  };
};

// Performance optimization for SEO
export const preloadCriticalResources = (resources) => {
  resources.forEach((resource) => {
    const link = document.createElement("link");
    link.rel = resource.rel || "preload";
    link.href = resource.href;
    if (resource.as) link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
    document.head.appendChild(link);
  });
};

// SEO monitoring and analytics
export const trackSEOMetrics = (pageData) => {
  // Track page views
  if (typeof gtag !== "undefined") {
    gtag("config", "GA_MEASUREMENT_ID", {
      page_title: pageData.title,
      page_location: pageData.url,
    });
  }

  // Track Core Web Vitals
  if (typeof window !== "undefined" && "performance" in window) {
    // Simple Core Web Vitals tracking
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "largest-contentful-paint") {
          console.error("LCP:", entry.startTime);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      // Fallback for browsers that don't support this
      console.error("Performance observer not supported", e);
    }
  }
};

export default {
  DEFAULT_SEO,
  generatePostSEO,
  generateTagSEO,
  generateSearchSEO,
  calculateReadingTime,
  generateArticleStructuredData,
  generateWebsiteStructuredData,
  generateBlogStructuredData,
  generateBreadcrumbStructuredData,
  getSEORecommendations,
  generateSitemapData,
  generateRobotsTxt,
  optimizeUrl,
  validateMetaTags,
  generateSocialTags,
  preloadCriticalResources,
  trackSEOMetrics,
};
