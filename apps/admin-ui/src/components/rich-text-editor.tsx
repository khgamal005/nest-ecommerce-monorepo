'use client';
import { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== valueRef.current) {
      ref.current.innerHTML = valueRef.current;
    }
  }, [value]);

  const handleInput = () => {
    const html = ref.current?.innerHTML ?? '';
    valueRef.current = html;
    onChangeRef.current?.(html);
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleInput}
      data-placeholder={placeholder}
      className="w-full min-h-[160px] px-3 py-2 bg-gray-700 border-2 border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-colors"
      style={{ whiteSpace: 'pre-wrap' }}
    />
  );
}
