# MindMap Feature Architecture

The MindMap feature in the Edunova LMS has been completely refactored into a deterministic, high-performance, and deeply hierarchical knowledge-graph generator.

## Data Flow Diagram

The following diagram illustrates the complete end-to-end data flow when an educator requests a new MindMap.

```mermaid
sequenceDiagram
    participant User
    participant Frontend (MindMapCanvas)
    participant API (mindmapRoutes)
    participant Service (mindmap.service)
    participant LLM (Gemini 2.5)
    participant Layout Engine (Dagre/ELK/D3)

    User->>Frontend (MindMapCanvas): Enter Topic & Click Generate
    Frontend (MindMapCanvas)->>API (mindmapRoutes): POST /api/mindmap/generate { topic, depth }
    API (mindmapRoutes)->>Service (mindmap.service): generateMindMapService()
    
    rect rgb(240, 248, 255)
        Note over Service (mindmap.service): Cache Check
        Service (mindmap.service)-->>Service (mindmap.service): Hash(topic+audience+depth) -> Check Cache
    end
    
    Service (mindmap.service)->>LLM (Gemini 2.5): Inject Prompt (14 HARD RULES)
    LLM (Gemini 2.5)-->>Service (mindmap.service): Raw JSON Response
    
    rect rgb(255, 240, 245)
        Note over Service (mindmap.service): Quality Gate & Auto-Repair
        Service (mindmap.service)->>Service (mindmap.service): Zod Validation
        alt Validation Fails
            Service (mindmap.service)->>LLM (Gemini 2.5): Re-prompt with Zod Errors (Max 2 retries)
            LLM (Gemini 2.5)-->>Service (mindmap.service): Repaired JSON
        end
    end
    
    rect rgb(240, 255, 240)
        Note over Service (mindmap.service): Post-Processing Pipeline
        Service (mindmap.service)->>Service (mindmap.service): assertSingleRoot()
        Service (mindmap.service)->>Service (mindmap.service): deduplicateNodes()
        Service (mindmap.service)->>Service (mindmap.service): enforceParentEdges()
        Service (mindmap.service)->>Service (mindmap.service): pruneOrphans()
        Service (mindmap.service)->>Service (mindmap.service): capDepthAndBreadth(4, 7)
        Service (mindmap.service)->>Service (mindmap.service): assignStableIds()
    end
    
    Service (mindmap.service)-->>API (mindmapRoutes): Sanitized JSON
    API (mindmapRoutes)-->>Frontend (MindMapCanvas): Sanitized JSON
    
    rect rgb(255, 255, 240)
        Note over Frontend (MindMapCanvas),Layout Engine (Dagre/ELK/D3): Geometric Auto-Layout
        Frontend (MindMapCanvas)->>Frontend (MindMapCanvas): useNodesInitialized()
        Frontend (MindMapCanvas)->>Layout Engine (Dagre/ELK/D3): Pass nodes with real DOM Width/Height
        Layout Engine (Dagre/ELK/D3)-->>Frontend (MindMapCanvas): Mutated Nodes with precise {x, y}
    end
    
    Frontend (MindMapCanvas)->>User: Render Zoom-to-Fit Diagram
```

## Core Components
1. **Canonical Data Contract**: Enforced via Zod schemas (`mindmapSchema.js`) to guarantee strict typings and object structures.
2. **AI System Prompt**: Enforces MECE (Mutually Exclusive, Collectively Exhaustive) principles, strict depth limits, and semantic node typing.
3. **Multi-Engine Auto-Layout**: Hook (`useMindMapLayout.js`) leveraging Dagre, ELK, or d3-hierarchy to mathematically space nodes based on exact DOM pixel dimensions, eliminating overlap completely.
4. **Export & LMS Integration**: Utilities (`mindmapExport.js`) to export graphs to Markdown study notes or convert topological graphs directly into nested LMS Course Outlines (Modules > Lessons > Topics).
