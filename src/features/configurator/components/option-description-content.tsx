export interface DescriptionBlock {
  type: "paragraph" | "list";
  content: string | string[];
}

export function parseDescriptionBlocks(description: string): DescriptionBlock[] {
  const normalizedDescription = description.replace(/\r\n/g, "\n").trim();

  if (normalizedDescription.length === 0) {
    return [];
  }

  const lines = normalizedDescription.split("\n");
  const blocks: DescriptionBlock[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphBuffer.join(" "),
    });
    paragraphBuffer = [];
  }

  function flushList() {
    if (listBuffer.length === 0) {
      return;
    }

    blocks.push({
      type: "list",
      content: [...listBuffer],
    });
    listBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("-")) {
      flushParagraph();
      listBuffer.push(line.replace(/^-+\s*/, ""));
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

interface OptionDescriptionContentProps {
  description: string;
  className?: string;
}

export function OptionDescriptionContent({
  description,
  className = "",
}: OptionDescriptionContentProps) {
  const blocks = parseDescriptionBlocks(description);

  if (blocks.length === 0) {
    return (
      <p className={className || "text-sm leading-6 text-[var(--color-muted-foreground)]"}>
        Description coming soon.
      </p>
    );
  }

  return (
    <div className={className || "space-y-4"}>
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul
            key={`list-${index}`}
            className="space-y-2 pl-5 text-sm leading-6 text-[var(--color-muted-foreground)]"
          >
            {(block.content as string[]).map((item) => (
              <li key={item} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p
            key={`paragraph-${index}`}
            className="text-sm leading-6 text-[var(--color-muted-foreground)]"
          >
            {block.content as string}
          </p>
        ),
      )}
    </div>
  );
}
