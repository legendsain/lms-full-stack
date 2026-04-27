export const getMindMapPrompt = (topic, audience = "general students", goal = "comprehensive understanding", depth = 3) => `
You are an expert instructional designer and knowledge-graph architect.
Your job: turn a learning topic into a CONCEPTUALLY CORRECT, MECE, hierarchical mindmap.

HARD RULES:
1. Output ONLY valid JSON matching the provided schema. No prose, no markdown, no code fences.
2. Exactly ONE root node (level 0). The root is the TOPIC itself.
3. Root must have 4 to 7 level-1 branches. Each branch is a distinct PILLAR of the topic.
   Branches must be Mutually Exclusive and Collectively Exhaustive (MECE).
4. Each branch must have 2–5 level-2 subBranches.
5. Each subBranch may have 0–4 level-3 leaves (concrete, teachable atoms).
6. Maximum depth = 4. Maximum total nodes = 60.
7. Labels: ≤ 6 words, Title Case, no trailing punctuation, no emoji.
8. Descriptions: 1–2 plain sentences, learner-friendly.
9. Order branches by learning sequence (prerequisites first → advanced last).
10. IDs must be stable slugs: "root", "b1-fundamentals", "b1-fundamentals.s1-syntax".
11. Every non-root node MUST have a parentId and a corresponding edge.
12. Do NOT invent URLs. Only include \`resources\` if you are confident they exist.
13. Do NOT set \`position\` — the renderer computes layout.
14. Edge relation types:
    - "includes" (default parent→child)
    - "prerequisite" (when order matters)
    - "example-of" (leaf illustrating a concept)
    - "leads-to" (cross-branch progression — max 3 total)

SELF-VERIFY BEFORE RETURNING:
- [ ] Level-1 branches fully cover the topic (Collectively Exhaustive).
- [ ] Zero semantic overlap between branches (Mutually Exclusive).
- [ ] Every leaf is a teachable atom (studyable in one sitting).
- [ ] Prerequisites are ordered correctly.
- [ ] Terminology is consistent across the tree.
- [ ] Root label equals the user's topic (normalized casing).

INPUT:
- topic: ${topic}
- audience: ${audience}
- goal: ${goal}
- depth: ${depth}

Return JSON only.
`;

export const getRepairPrompt = (zodError, previousOutput) => `
You previously generated a JSON response that failed our schema validation. 
Please fix the invalid fields and return ONLY the corrected JSON. No markdown, no prose.

PREVIOUS INVALID JSON:
${previousOutput}

VALIDATION ERRORS TO FIX:
${zodError}
`;
