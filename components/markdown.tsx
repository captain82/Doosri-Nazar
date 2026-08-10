import type { ReactNode } from "react";

// Minimal, dependency-free Markdown → React renderer for chat/report text.
// Handles what the model actually emits: **bold**, *italic*, `code`, bullet
// and numbered lists, ### headings, and blank-line paragraphs. Builds React
// nodes (no dangerouslySetInnerHTML) so it's XSS-safe and streaming-friendly, // an unclosed **…** mid-stream simply renders literally until it closes.

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b${k}`} className="font-semibold text-ink">
          {m[2]}
        </strong>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i${k}`}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-c${k}`} className="rounded bg-ink/[0.06] px-1 py-0.5 text-[0.9em]">
          {m[4]}
        </code>,
      );
    }
    last = re.lastIndex;
    k++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const BULLET = /^(\s*)[-*]\s+(.*)$/;
const NUMBERED = /^(\s*)\d+\.\s+(.*)$/;
const HEADING = /^(#{1,6})\s+(.*)$/;

export default function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let bk = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Bullet list (with a light indent for nested items)
    if (BULLET.test(line)) {
      const items: { indent: number; content: string }[] = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        const mm = lines[i].match(BULLET)!;
        items.push({ indent: mm[1].length, content: mm[2] });
        i++;
      }
      const key = `ul${bk++}`;
      blocks.push(
        <ul key={key} className="my-2 space-y-1.5">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2" style={{ paddingLeft: it.indent > 1 ? 16 : 0 }}>
              <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-ink/40" />
              <span className="min-w-0">{inline(it.content, `${key}-${idx}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (NUMBERED.test(line)) {
      const items: string[] = [];
      while (i < lines.length && NUMBERED.test(lines[i])) {
        items.push(lines[i].match(NUMBERED)![2]);
        i++;
      }
      const key = `ol${bk++}`;
      blocks.push(
        <ol key={key} className="my-2 list-decimal space-y-1.5 pl-5 marker:text-ink/40">
          {items.map((it, idx) => (
            <li key={idx} className="pl-1">
              {inline(it, `${key}-${idx}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Heading
    if (HEADING.test(line)) {
      const mm = line.match(HEADING)!;
      const key = `h${bk++}`;
      blocks.push(
        <p key={key} className="mb-1 mt-3 font-semibold text-ink first:mt-0">
          {inline(mm[2], key)}
        </p>,
      );
      i++;
      continue;
    }

    // Paragraph, gather consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i]) &&
      !HEADING.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    const key = `p${bk++}`;
    blocks.push(
      <p key={key} className="my-2 first:mt-0 last:mb-0">
        {para.map((ln, idx) => (
          <span key={idx}>
            {inline(ln, `${key}-${idx}`)}
            {idx < para.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>,
    );
  }

  return <div className={className}>{blocks}</div>;
}
