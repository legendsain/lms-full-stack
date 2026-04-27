import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, Video, FileText, CheckCircle2 } from 'lucide-react';

const getHandles = (targetPosition, sourcePosition) => (
    <>
        {targetPosition && <Handle type="target" position={targetPosition} className="!w-2 !h-2 !bg-surface-400 !border-2 !border-white" />}
        {sourcePosition && <Handle type="source" position={sourcePosition} className="!w-2 !h-2 !bg-surface-400 !border-2 !border-white" />}
    </>
);

export const MindMapRootNode = ({ data, targetPosition, sourcePosition }) => (
    <div className="px-8 py-5 bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-brand-500/30 border-[3px] border-white/20 min-w-[220px] max-w-[300px] text-center select-none relative overflow-hidden">
        {getHandles(targetPosition, sourcePosition)}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
        <div className="flex flex-col items-center gap-2">
            <span className="text-2xl mb-1">{data.icon || '🎯'}</span>
            <div className="text-lg font-black tracking-tight leading-snug">{data.label}</div>
            {data.description && <div className="text-xs text-brand-100/90 font-medium line-clamp-2">{data.description}</div>}
        </div>
    </div>
);

export const MindMapBranchNode = ({ data, targetPosition, sourcePosition }) => {
    const colorClass = data.color || 'bg-slate-800 text-white';
    
    return (
        <div className={`px-6 py-4 ${colorClass} rounded-xl shadow-lg border-2 border-white/10 min-w-[180px] max-w-[240px] text-center select-none relative transition-transform hover:-translate-y-0.5`}>
            {getHandles(targetPosition, sourcePosition)}
            <div className="text-sm font-extrabold tracking-wide uppercase mb-1 opacity-80">PILLAR</div>
            <div className="text-base font-bold leading-snug">{data.label}</div>
        </div>
    );
};

export const MindMapSubBranchNode = ({ data, targetPosition, sourcePosition }) => (
    <div className="px-5 py-3 bg-surface-50 border-2 border-surface-200 rounded-lg shadow-sm hover:shadow-md hover:border-surface-300 transition-all min-w-[160px] max-w-[220px] text-center select-none relative">
        {getHandles(targetPosition, sourcePosition)}
        <div className="text-sm font-bold text-surface-800 leading-snug">{data.label}</div>
    </div>
);

export const MindMapLeafNode = ({ data, targetPosition, sourcePosition }) => (
    <div className="px-4 py-3 bg-white border border-surface-200 rounded-md shadow-sm hover:border-brand-300 transition-all min-w-[150px] max-w-[200px] text-left select-none relative group">
        {getHandles(targetPosition, sourcePosition)}
        <div className="flex items-start gap-2">
            <div className="mt-0.5 text-brand-500"><CheckCircle2 size={14} /></div>
            <div>
                <div className="text-xs font-bold text-surface-900 leading-tight mb-1">{data.label}</div>
                {data.resources?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                        {data.resources.slice(0, 3).map((res, i) => (
                            <div key={i} className="bg-surface-100 text-surface-500 p-1 rounded">
                                {res.kind === 'video' ? <Video size={10} /> : <FileText size={10} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

export const MindMapNoteNode = ({ data, targetPosition, sourcePosition }) => (
    <div className="px-4 py-2 bg-amber-50/50 border border-dashed border-amber-300 rounded-lg min-w-[140px] max-w-[200px] text-center select-none relative">
        {getHandles(targetPosition, sourcePosition)}
        <div className="text-[10px] font-bold text-amber-700/60 uppercase mb-0.5">Note</div>
        <div className="text-xs font-medium text-amber-900 leading-snug italic">{data.label}</div>
    </div>
);

export const nodeTypes = {
    root: MindMapRootNode,
    branch: MindMapBranchNode,
    subBranch: MindMapSubBranchNode,
    leaf: MindMapLeafNode,
    note: MindMapNoteNode,
    // fallback
    mindmapNode: MindMapSubBranchNode 
};
