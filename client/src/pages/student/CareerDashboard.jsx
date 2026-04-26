import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/student/Footer';

const CareerDashboard = () => {
    const { backendUrl, getToken, navigate } = useContext(AppContext);

    const [targetRole, setTargetRole] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!targetRole.trim()) return toast.error("Please enter a target job role");

        setLoading(true);
        setAnalysis(null);
        try {
            const token = await getToken();
            const { data } = await axios.post(
                backendUrl + '/api/career/analyze',
                { targetRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setAnalysis(data.analysisData);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    // Score ring color helper
    const scoreColor = (score) => {
        if (score >= 80) return { ring: 'border-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', glow: 'shadow-emerald-200/50' };
        if (score >= 50) return { ring: 'border-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', glow: 'shadow-amber-200/50' };
        return { ring: 'border-red-400', text: 'text-red-600', bg: 'bg-red-50', glow: 'shadow-red-200/50' };
    };

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col">
            <div className="flex-grow section-container pt-10 pb-20 animate-fade-in">
                <button onClick={() => navigate('/')} className="btn-ghost mb-6 !px-0 gap-2 text-surface-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back to Home
                </button>

                <div className="max-w-5xl">
                    <span className="badge-primary mb-3 inline-flex">AI-Powered Career Analysis</span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight">CareerLink 🚀</h1>
                    <p className="text-surface-500 mt-2 mb-8">Get a personalized career roadmap based on your actual learning data — courses, quiz scores, and progress.</p>

                    {/* ============ INPUT SECTION ============ */}
                    <div className="premium-card p-6 md:p-8 mb-10">
                        <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">I want to become a...</label>
                        <div className="flex gap-3 mt-3">
                            <input
                                type="text"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                placeholder="e.g. Full Stack Developer, Data Scientist, Product Manager"
                                className="input-field flex-1 !text-base"
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                disabled={loading}
                            />
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="btn-accent flex-shrink-0 min-w-[160px] disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                        Analyzing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                                        </svg>
                                        Analyze My Gap
                                    </span>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-surface-400 mt-3">⚡ Analysis uses your enrolled courses, quiz scores, and learning progress for personalized results.</p>
                    </div>

                    {/* ============ RESULTS ============ */}
                    {analysis && (
                        <div className="space-y-8 animate-fade-in-up">

                            {/* --- ROW 1: Score + Summary + Strengths --- */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                {/* Score Ring */}
                                <div className="md:col-span-3 premium-card p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Readiness Score</p>
                                    <div className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-extrabold border-4 shadow-lg ${scoreColor(analysis.score).ring} ${scoreColor(analysis.score).text} ${scoreColor(analysis.score).bg} ${scoreColor(analysis.score).glow}`}>
                                        {analysis.score}%
                                    </div>
                                    <p className="text-xs text-surface-400 mt-3">
                                        {analysis.score >= 80 ? 'You\'re almost there!' : analysis.score >= 50 ? 'Good progress, keep going!' : 'Lots of room to grow!'}
                                    </p>
                                </div>

                                {/* Summary + Skills */}
                                <div className="md:col-span-9 premium-card p-6">
                                    {/* Personalized Summary */}
                                    {analysis.summary && (
                                        <div className="mb-5 pb-5 border-b border-surface-100">
                                            <p className="text-surface-700 text-sm leading-relaxed italic">"{analysis.summary}"</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Strengths */}
                                        {analysis.strengths && analysis.strengths.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">Your Strengths</h3>
                                                <div className="space-y-2">
                                                    {analysis.strengths.map((strength, i) => (
                                                        <div key={i} className="flex items-start gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-sm text-surface-700">{strength}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Missing Skills */}
                                        <div>
                                            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">Skills to Develop</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.missingSkills && analysis.missingSkills.map((skill, i) => (
                                                    <span key={i} className="badge-danger">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- ROW 2: Career Paths --- */}
                            {analysis.careerPaths && analysis.careerPaths.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-surface-900 mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 0 1-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                        </svg>
                                        Recommended Career Paths
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {analysis.careerPaths.map((path, i) => (
                                            <div key={i} className={`premium-card p-5 hover-lift relative overflow-hidden ${i === 0 ? 'ring-2 ring-brand-200' : ''}`}>
                                                {i === 0 && (
                                                    <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl">BEST MATCH</div>
                                                )}
                                                <div className="text-3xl mb-3">{path.icon || '💼'}</div>
                                                <h3 className="font-bold text-surface-900 text-base mb-1">{path.title}</h3>
                                                <p className="text-surface-500 text-sm leading-relaxed mb-4">{path.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-surface-100 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-700 ${path.matchScore >= 80 ? 'bg-emerald-500' : path.matchScore >= 60 ? 'bg-brand-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${path.matchScore}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-surface-700 tabular-nums">{path.matchScore}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- ROW 3: Career Roadmap Timeline --- */}
                            {analysis.roadmap && analysis.roadmap.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-surface-900 mb-6 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                        </svg>
                                        Your Learning Roadmap
                                    </h2>

                                    {/* Desktop Timeline */}
                                    <div className="hidden md:block relative">
                                        {/* Connecting Line */}
                                        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-brand-400 to-emerald-400 z-0"></div>

                                        <div className="grid grid-cols-4 gap-4 relative z-10">
                                            {analysis.roadmap.map((phase, i) => (
                                                <div key={i} className="flex flex-col items-center text-center">
                                                    {/* Node */}
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 mb-4 ${
                                                        i === analysis.roadmap.length - 1
                                                            ? 'bg-emerald-100 border-emerald-300'
                                                            : 'bg-white border-brand-200'
                                                    }`}>
                                                        {phase.icon || '📌'}
                                                    </div>

                                                    {/* Card */}
                                                    <div className="premium-card p-4 w-full text-left">
                                                        <h4 className="font-bold text-surface-900 text-sm mb-1">{phase.phase}</h4>
                                                        <span className="badge-primary mb-3 inline-flex !text-[10px]">{phase.duration}</span>
                                                        <ul className="space-y-1.5">
                                                            {phase.tasks.map((task, j) => (
                                                                <li key={j} className="flex items-start gap-2 text-xs text-surface-600">
                                                                    <span className="text-brand-400 mt-0.5 flex-shrink-0">▸</span>
                                                                    {task}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mobile Timeline (Vertical) */}
                                    <div className="md:hidden relative pl-8">
                                        {/* Vertical Line */}
                                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-300 to-emerald-400"></div>

                                        <div className="space-y-6">
                                            {analysis.roadmap.map((phase, i) => (
                                                <div key={i} className="relative">
                                                    {/* Dot */}
                                                    <div className={`absolute -left-[22px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                                                        i === analysis.roadmap.length - 1
                                                            ? 'bg-emerald-100 border-emerald-400'
                                                            : 'bg-white border-brand-400'
                                                    }`}>
                                                        {i + 1}
                                                    </div>

                                                    <div className="premium-card p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xl">{phase.icon || '📌'}</span>
                                                            <h4 className="font-bold text-surface-900 text-sm">{phase.phase}</h4>
                                                        </div>
                                                        <span className="badge-primary mb-3 inline-flex !text-[10px]">{phase.duration}</span>
                                                        <ul className="space-y-1.5">
                                                            {phase.tasks.map((task, j) => (
                                                                <li key={j} className="flex items-start gap-2 text-xs text-surface-600">
                                                                    <span className="text-brand-400 mt-0.5 flex-shrink-0">▸</span>
                                                                    {task}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- ROW 4: AI Advice --- */}
                            {analysis.advice && (
                                <div className="premium-card p-6 bg-gradient-to-r from-brand-50/50 to-violet-50/50 border-brand-200/40">
                                    <h3 className="font-bold text-surface-900 mb-2 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                        </svg>
                                        Personalized AI Advice
                                    </h3>
                                    <p className="text-surface-600 text-sm leading-relaxed">{analysis.advice}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CareerDashboard;