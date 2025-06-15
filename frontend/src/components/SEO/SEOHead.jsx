import React from "react";
import { Helmet } from "react-helmet-async";
import {
  generateSocialTags,
  generateArticleStructuredData,
  generateWebsiteStructuredData,
  generateBreadcrumbStructuredData,
  DEFAULT_SEO,
} from "../../utils/seoUtils";

const SEOHead = ({
  seoData = DEFAULT_SEO,
  post = null,
  breadcrumbs = null,
  structuredData = null,
}) => {
  // Generate social media tags
  const socialTags = generateSocialTags(seoData);

  // Generate structured data
  let jsonLd = [];

  // Website structured data (always include)
  jsonLd.push(generateWebsiteStructuredData());

  // Article structured data for blog posts
  if (post) {
    const articleData = generateArticleStructuredData(post, seoData);
    if (articleData) jsonLd.push(articleData);
  }

  // Breadcrumb structured data
  if (breadcrumbs) {
    const breadcrumbData = generateBreadcrumbStructuredData(breadcrumbs);
    if (breadcrumbData) jsonLd.push(breadcrumbData);
  }

  // Custom structured data
  if (structuredData) {
    if (Array.isArray(structuredData)) {
      jsonLd.push(...structuredData);
    } else {
      jsonLd.push(structuredData);
    }
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      <meta name="author" content={seoData.author} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Canonical URL */}
      <link rel="canonical" href={seoData.url} />

      {/* Open Graph Tags */}
      {Object.entries(socialTags).map(([property, content]) => {
        if (property.startsWith("og:")) {
          return <meta key={property} property={property} content={content} />;
        }
        return null;
      })}

      {/* Twitter Tags */}
      {Object.entries(socialTags).map(([name, content]) => {
        if (name.startsWith("twitter:")) {
          return <meta key={name} name={name} content={content} />;
        }
        return null;
      })}

      {/* Article specific meta tags */}
      {post && (
        <>
          <meta property="article:published_time" content={post.createdAt} />
          <meta property="article:modified_time" content={post.updatedAt} />
          <meta property="article:author" content={seoData.author} />
          {post.tags &&
            post.tags.map((tag) => (
              <meta key={tag} property="article:tag" content={tag} />
            ))}
          {post.category && (
            <meta property="article:section" content={post.category} />
          )}
        </>
      )}

      {/* Structured Data */}
      {jsonLd.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Reading Time for Articles */}
      {seoData.readingTime && (
        <>
          <meta name="twitter:label1" content="Reading time" />
          <meta
            name="twitter:data1"
            content={`${seoData.readingTime} min read`}
          />
        </>
      )}
    </Helmet>
  );
};

export default SEOHead;
