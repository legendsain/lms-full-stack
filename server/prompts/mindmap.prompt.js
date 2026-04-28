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

EXPECTED JSON STRUCTURE (follow this shape exactly; values are examples):
{
  "version": "1.0",
  "topic": "Machine Learning",
  "summary": "A structured overview from foundations to practical deployment.",
  "nodes": [
    {
      "id": "root",
      "type": "mindmapNode",
      "data": {
        "label": "Machine Learning",
        "description": "The central topic and learning objective.",
        "type": "root",
        "level": 0
      }
    },
    {
      "id": "b1-foundations",
      "type": "mindmapNode",
      "data": {
        "label": "Foundations",
        "description": "Core concepts and terminology.",
        "type": "branch",
        "level": 1
      },
      "parentId": "root"
    },
    {
      "id": "sb1-supervised-learning",
      "type": "mindmapNode",
      "data": {
        "label": "Supervised Learning",
        "description": "Learning from labeled data.",
        "type": "subBranch",
        "level": 2
      },
      "parentId": "b1-foundations"
    },
    {
      "id": "l1-linear-regression",
      "type": "mindmapNode",
      "data": {
        "label": "Linear Regression",
        "description": "A baseline predictive model.",
        "type": "leaf",
        "level": 3,
        "keywords": ["regression", "prediction"],
        "estimatedMinutes": 30
      },
      "parentId": "sb1-supervised-learning"
    }
  ],
  "edges": [
    {
      "id": "e-root-b1-foundations",
      "source": "root",
      "target": "b1-foundations",
      "type": "mindmapEdge",
      "data": { "relation": "includes" }
    },
    {
      "id": "e-b1-foundations-sb1-supervised-learning",
      "source": "b1-foundations",
      "target": "sb1-supervised-learning",
      "type": "mindmapEdge",
      "data": { "relation": "includes" }
    },
    {
      "id": "e-sb1-supervised-learning-l1-linear-regression",
      "source": "sb1-supervised-learning",
      "target": "l1-linear-regression",
      "type": "mindmapEdge",
      "data": { "relation": "example-of" }
    }
  ]
}

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
