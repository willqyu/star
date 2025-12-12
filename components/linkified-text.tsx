import { linkifyText } from '@/lib/utils/linkify';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className = 'text-gray-700 whitespace-pre-wrap' }: LinkifiedTextProps) {
  const parts = linkifyText(text);
  
  return <p className={className}>{parts}</p>;
}
