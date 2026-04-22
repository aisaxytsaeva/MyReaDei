import React from 'react';
import { Helmet } from 'react-helmet-async';
import type {SeoManagerProps} from "../../types";


export const SeoManager: React.FC<SeoManagerProps> = ({
  title,
  description,
  canonicalUrl,
  noIndex = false,
  noFollow = false,
  ogImage = '/assets/logo.svg',
  ogType = 'website',
}) => {
  const robotsContent = [];
  if (noIndex) robotsContent.push('noindex');
  if (noFollow) robotsContent.push('nofollow');
  if (robotsContent.length === 0) robotsContent.push('index, follow');
  
  const fullTitle = `${title} | MyReaDei`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent.join(', ')} />
      
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage || '/assets/logo.svg'} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl || window.location.href} />
      
      
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Russian" />
    </Helmet>
  );
};