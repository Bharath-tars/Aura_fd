import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  isStreaming: boolean;
}

export default function StreamingText({ text, isStreaming }: Props) {
  const [displayed, setDisplayed] = useState(text);
  const prevRef = useRef(text);

  useEffect(() => {
    setDisplayed(text);
    prevRef.current = text;
  }, [text]);

  return (
    <span className="whitespace-pre-wrap break-words">
      {displayed}
      {isStreaming && (
        <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}
