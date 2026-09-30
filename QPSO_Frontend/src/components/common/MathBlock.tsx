import React, { useMemo } from 'react';
import katex from 'katex';

interface MathBlockProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({
  math,
  block = true,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch (e) {
      return `<span class="text-rose-500">${math}</span>`;
    }
  }, [math, block]);

  return (
    <div
      className={`overflow-x-auto py-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
