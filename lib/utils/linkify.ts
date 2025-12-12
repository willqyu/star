import React from 'react';

/**
 * Converts URLs in text to clickable links
 * Detects both http(s):// URLs and www. URLs
 */
export function linkifyText(text: string): (string | React.ReactElement)[] {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let linkCount = 0;

  text.replace(urlRegex, (match, p1, offset) => {
    // Add text before the URL
    if (offset > lastIndex) {
      parts.push(text.substring(lastIndex, offset));
    }

    // Ensure the URL has a protocol
    let url = match;
    if (match.startsWith('www.')) {
      url = 'https://' + match;
    }

    // Add the link
    parts.push(
      React.createElement(
        'a',
        {
          key: `link-${linkCount}`,
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-blue-600 hover:underline',
        },
        match
      )
    );

    linkCount++;
    lastIndex = offset + match.length;
    return match;
  });

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
