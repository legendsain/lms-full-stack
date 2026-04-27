import { z } from 'zod';

// ============================================================================
// PART 2: CANONICAL DATA CONTRACT (ZOD SCHEMA)
// This file enforces the exact structure required for the MindMap Feature.
// It will be used to validate and auto-repair AI outputs.
// ============================================================================

export const mindMapNodeTypeSchema = z.enum([
    'root',       // the central topic (exactly 1)
    'branch',     // level-1 main pillars (4–7 ideal)
    'subBranch',  // level-2 sub-topics
    'leaf',       // level-3+ concrete concepts / examples / resources
    'note'        // optional callouts (definitions, tips, warnings)
]);

export const mindMapNodeDataSchema = z.object({
    label: z.string().max(50, "Label should be short (≤ 6 words)"),
    description: z.string().optional(),
    type: mindMapNodeTypeSchema,
    level: z.number().int().min(0),
    icon: z.string().optional(),
    color: z.string().optional(),
    resources: z.array(z.object({
        title: z.string(),
        url: z.string().url(),
        kind: z.enum(['video', 'article', 'doc', 'quiz'])
    })).optional(),
    keywords: z.array(z.string()).optional(),
    estimatedMinutes: z.number().int().positive().optional()
});

export const mindMapNodeSchema = z.object({
    id: z.string(), // stable slug e.g. "root", "b1-fundamentals"
    type: z.literal('mindmapNode').default('mindmapNode'),
    data: mindMapNodeDataSchema,
    position: z.object({ x: z.number(), y: z.number() }).optional().default({ x: 0, y: 0 }), // filled by auto-layout
    parentId: z.string().optional()
});

export const mindMapEdgeSchema = z.object({
    id: z.string(), // `e-${source}-${target}`
    source: z.string(),
    target: z.string(),
    type: z.literal('mindmapEdge').default('mindmapEdge'),
    animated: z.boolean().optional(),
    data: z.object({
        relation: z.enum(['includes', 'leads-to', 'example-of', 'prerequisite']).optional()
    }).optional()
});

export const mindMapMetaSchema = z.object({
    createdAt: z.string(), // ISO date string
    model: z.string(),
    depth: z.number().int().min(0),
    breadth: z.number().int().min(0)
}).optional(); // Make meta optional during AI generation, we will compute it later if missing

export const mindMapSchema = z.object({
    version: z.literal('1.0').default('1.0'),
    topic: z.string(),
    summary: z.string(),
    nodes: z.array(mindMapNodeSchema),
    edges: z.array(mindMapEdgeSchema),
    meta: mindMapMetaSchema
});

/**
 * Validates the raw JSON output from the AI model against the canonical schema.
 * @param {Object} rawData - The parsed JSON from the AI
 * @returns {Object} - An object containing { success, data, error }
 */
export const validateMindMapData = (rawData) => {
    return mindMapSchema.safeParse(rawData);
};
