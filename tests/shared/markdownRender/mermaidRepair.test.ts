import { describe, it, expect } from "vitest";
import {
  mermaidKind,
  mermaidRecoveryLadder,
  mermaidCandidates,
  repairMermaidSource,
} from "../../../src/shared/components/markdownRender/mermaidRepair";

const VALID = "flowchart TD\n  A[Start] --> B[End]";

async function collect(source: string): Promise<string[]> {
  const out: string[] = [];
  for await (const attempt of mermaidRecoveryLadder(source, async () => true)) {
    out.push(attempt.source);
  }
  return out;
}

describe("mermaidKind", () => {
  it("reads the family keyword off the first real line", () => {
    expect(mermaidKind("flowchart TD\n A --> B")).toBe("flowchart");
    // `-v2` ends the word match, so the family is read as `statediagram` -
    // which is exactly what `DELIMITED_LABEL_KINDS` leaves out, because a
    // state diagram's labels are free text and already tolerate brackets.
    expect(mermaidKind("stateDiagram-v2\n [*] --> A")).toBe("statediagram");
    expect(mermaidKind("%% a comment\ngraph LR\n A --> B")).toBe("graph");
  });

  it("returns an empty string when there is no header", () => {
    expect(mermaidKind("")).toBe("");
  });
});

describe("repairMermaidSource", () => {
  it("quotes a label whose parentheses would end it early", () => {
    const repaired = repairMermaidSource("flowchart TD\n  B1[Selection Tests (final)]");
    expect(repaired).toContain('"Selection Tests (final)"');
  });

  it("quotes a question-mark diamond label holding a bracket", () => {
    const repaired = repairMermaidSource("flowchart TD\n  A{Step [1]}");
    expect(repaired).toContain('"Step [1]"');
  });

  it("quotes an edge label holding a parenthesis", () => {
    // `|yes (go on)|` is quoted *inside* the pipes: that is the form mermaid
    // accepts, and dropping the quotes would leave the parenthesis ending the
    // label early.
    const repaired = repairMermaidSource("flowchart TD\n  A -->|yes (go on)| B");
    expect(repaired).toContain('|"yes (go on)"|');
  });

  it("leaves an already-quoted label alone", () => {
    const source = 'flowchart TD\n  B1["Selection Tests"]';
    expect(repairMermaidSource(source)).toBe(source);
  });

  it("matches a nested label on depth, not on the first bracket", () => {
    // `((Step (one)))` must keep its inner parenthesis inside the label; a
    // first-bracket match would cut it after `Step (one` and quote a fragment.
    const repaired = repairMermaidSource("flowchart TD\n  A((Step (one)))");
    expect(repaired).toContain('A(("Step (one)"))');
  });

  it("undoes delimiters mirrored around RTL text", () => {
    // A model writing Mermaid for Persian flips the brackets.
    const repaired = repairMermaidSource("flowchart TD\n  ]میانگین / Mean[A1");
    expect(repaired).toContain("A1[");
  });

  it("quotes a bare multi-word subgraph title holding a bracket", () => {
    const repaired = repairMermaidSource(
      "flowchart TD\n  subgraph Item Characteristic Curve (ICC)\n  end",
    );
    expect(repaired).toContain('subgraph "Item Characteristic Curve (ICC)"');
  });

  it("closes the gap in `subgraph id [label]` so the label can be quoted", () => {
    const repaired = repairMermaidSource("flowchart TD\n  subgraph core [Group (x)]");
    expect(repaired).toContain("subgraph core[");
  });

  it("quotes a pie slice label holding a parenthesis", () => {
    const repaired = repairMermaidSource("pie\n  \"Dogs\" : 5\n  Cats (many) : 3");
    expect(repaired).toContain('"Cats (many)"');
  });

  it("unwraps a quadrant axis whose range sits in parentheses", () => {
    const repaired = repairMermaidSource(
      "quadrantChart\n  x-axis Low --> High\n  x-axis A (Low --> High)",
    );
    expect(repaired).toContain("x-axis A Low --> High");
  });

  it("rewrites a glyph arrow into a real link", () => {
    const repaired = repairMermaidSource("flowchart TD\n  A[One] → B[Two]");
    expect(repaired).toContain("-->");
  });

  it("leaves a glyph arrow inside a label alone when a real arrow exists", () => {
    const source = "flowchart TD\n  A[x → y] --> B";
    expect(repairMermaidSource(source)).toBe(source);
  });

  it("drops the offending characters in the aggressive pass", () => {
    const repaired = repairMermaidSource(
      "flowchart TD\n  B1[Selection Tests (final)]",
      true,
    );
    expect(repaired).toContain("B1[Selection Tests final]");
  });

  it("never blanks a node out entirely", () => {
    const repaired = repairMermaidSource("flowchart TD\n  A[(())]", true);
    expect(repaired).toContain("A[");
  });
});

describe("mermaidCandidates", () => {
  it("offers the original source first, then the repairs", () => {
    const source = "flowchart TD\n  B1[Tests (final)]";
    const candidates = mermaidCandidates(source);
    expect(candidates[0]).toBe(source);
    expect(candidates.length).toBeGreaterThan(1);
  });

  it("collapses duplicates when the repairs change nothing", () => {
    const candidates = mermaidCandidates(VALID);
    expect(candidates).toEqual([VALID]);
  });
});

describe("mermaidRecoveryLadder", () => {
  it("yields the original source when the parser accepts it", async () => {
    const sources = await collect(VALID);
    expect(sources).toEqual([VALID]);
  });

  it("stops at the first candidate the parser accepts", async () => {
    // Candidate 1 (original) is rejected, candidate 2 (the quoting repair) is
    // accepted, so the ladder must not go on to try the lossy passes.
    const seen: string[] = [];
    for await (const attempt of mermaidRecoveryLadder(
      "flowchart TD\n  B1[Tests (final)]",
      async (candidate) => {
        seen.push(candidate);
        return candidate.includes('"');
      },
    )) {
      expect(attempt.stage).toBe("quoted");
      break;
    }
    expect(seen.length).toBe(2);
  });

  it("accepts a source the model wrote even when nothing else parses", async () => {
    // The first candidate is always the model's own text: a diagram that only
    // "needs" a repair must still render when the repair cannot be verified.
    const sources = await collect("flowchart TD\n  style A fill:#f00");
    expect(sources[0]).toBe("flowchart TD\n  style A fill:#f00");
  });

  it("yields nothing when no candidate parses", async () => {
    // The caller surfaces the real parser message in this case; offering an
    // unverified source would draw a broken or empty diagram instead.
    const stages: string[] = [];
    for await (const attempt of mermaidRecoveryLadder(
      "flowchart TD\n  B1[Tests (final)]",
      async () => false,
    )) {
      stages.push(attempt.stage);
    }
    expect(stages).toEqual([]);
  });
});