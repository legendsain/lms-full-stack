import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const PredictiveAnalytics = () => {
    const { backendUrl, getToken } = useContext(AppContext);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifyingId, setNotifyingId] = useState(null);

    const handleNotify = async (student) => {
        setNotifyingId(student.studentId);
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/analytics/notify', {
                studentId: student.studentId,
                email: student.email,
                name: student.name,
                riskReasons: student.riskReasons
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(`Email successfully sent to ${student.name}`);
            } else {
                toast.error(data.message || "Failed to send email");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred while sending the email");
        } finally {
            setNotifyingId(null);
        }
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(backendUrl + '/api/analytics/at-risk', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setStudents(data.atRiskData);
                }
            } catch (error) {
                toast.error("Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="p-4 flex items-center gap-3 text-surface-400">
            <div className="w-4 h-4 rounded-full border-2 border-surface-200 border-t-brand-600 animate-spin"></div>
            Loading At-Risk Analytics...
        </div>
    );

    if (students.length === 0) return (
        <div className="premium-card p-6 text-center bg-emerald-50/50 border-emerald-200/60">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="text-emerald-800 font-bold">All Clear!</h3>
            <p className="text-emerald-600 text-sm mt-1">No students are currently flagged as "At Risk".</p>
        </div>
    );

    // Group by risk level
    const critical = students.filter(s => s.riskLevel === 'critical');
    const high = students.filter(s => s.riskLevel === 'high');
    const medium = students.filter(s => s.riskLevel === 'medium');

    const riskLevelConfig = {
        critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
        high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
        medium:   { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    };

    const renderRiskBadge = (level) => {
        const config = riskLevelConfig[level] || riskLevelConfig.medium;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${config.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                {level}
            </span>
        );
    };

    return (
        <div className="premium-card overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-red-700 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            At-Risk Student Alert
                        </h2>
                        <p className="text-xs text-red-500 mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} flagged — review and take action.</p>
                    </div>
                    {/* Summary Badges */}
                    <div className="flex items-center gap-2">
                        {critical.length > 0 && (
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">{critical.length} Critical</span>
                        )}
                        {high.length > 0 && (
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">{high.length} High</span>
                        )}
                        {medium.length > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{medium.length} Medium</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
                {students.map((student) => (
                    <div key={student.studentId} className={`p-4 transition-colors ${
                        student.riskLevel === 'critical' ? 'bg-red-50/30 hover:bg-red-50/60' :
                        student.riskLevel === 'high' ? 'hover:bg-orange-50/40' :
                        'hover:bg-surface-50'
                    }`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            {/* Student Info */}
                            <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
                                <div className="relative flex-shrink-0">
                                    <img src={student.imageUrl} alt="" className="w-10 h-10 rounded-full ring-2 ring-surface-100" />
                                    {student.riskLevel === 'critical' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="text-white text-[8px] font-bold">!</span>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-surface-900 text-sm truncate">{student.name}</h4>
                                    <p className="text-xs text-surface-400 truncate">{student.email}</p>
                                </div>
                            </div>

                            {/* Risk Factors */}
                            <div className="flex gap-5 text-xs w-full md:w-1/4 justify-start md:justify-center">
                                <div className="text-center">
                                    <span className={`block font-bold ${student.factors.daysInactive > 7 ? 'text-red-600' : 'text-surface-700'}`}>
                                        {student.factors.daysInactive}d
                                    </span>
                                    <span className="text-surface-400">Inactive</span>
                                </div>
                                <div className="text-center">
                                    <span className={`block font-bold ${student.factors.avgScore < 50 ? 'text-red-600' : student.factors.avgScore > 0 ? 'text-amber-600' : 'text-surface-400'}`}>
                                        {student.factors.avgScore > 0 ? `${student.factors.avgScore}%` : '—'}
                                    </span>
                                    <span className="text-surface-400">Avg Score</span>
                                </div>
                                <div className="text-center">
                                    <span className="block font-bold text-surface-700">{student.factors.completionRate}%</span>
                                    <span className="text-surface-400">Completion</span>
                                </div>
                            </div>

                            {/* Risk Reasons */}
                            <div className="w-full md:w-1/4">
                                {student.riskReasons && student.riskReasons.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {student.riskReasons.slice(0, 2).map((reason, i) => (
                                            <span key={i} className="text-[10px] bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Risk Score & Actions */}
                            <div className="w-full md:w-1/4 flex items-center justify-between md:justify-end gap-3">
                                <div className="flex items-center gap-3">
                                    {renderRiskBadge(student.riskLevel)}
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-surface-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                                    student.riskScore > 80 ? 'bg-red-500' :
                                                    student.riskScore > 60 ? 'bg-orange-500' :
                                                    'bg-amber-400'
                                                }`}
                                                style={{ width: `${student.riskScore}%` }}
                                            ></div>
                                        </div>
                                        <span className={`font-bold text-sm tabular-nums ${
                                            student.riskScore > 80 ? 'text-red-600' :
                                            student.riskScore > 60 ? 'text-orange-600' :
                                            'text-amber-600'
                                        }`}>
                                            {student.riskScore}%
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleNotify(student)}
                                    disabled={notifyingId === student.studentId}
                                    className="btn-secondary !text-xs !px-3 !py-1.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {notifyingId === student.studentId ? "Sending..." : "Notify"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PredictiveAnalytics;