import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const PredictiveAnalytics = () => {
    const { backendUrl, getToken } = useContext(AppContext);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-4 text-gray-400">Loading AI Predictions...</div>;

    if (students.length === 0) return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-green-800 font-bold">All Clear!</h3>
            <p className="text-green-600">No students are currently flagged as "At Risk".</p>
        </div>
    );

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                        ⚠️ Dropout Prediction Alert
                    </h2>
                    <p className="text-xs text-red-500">AI has flagged {students.length} students requiring attention.</p>
                </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {students.map((student) => (
                    <div key={student.studentId} className="p-4 hover:bg-gray-50 transition flex flex-col md:flex-row items-center gap-4">
                        {/* Student Info */}
                        <div className="flex items-center gap-3 w-full md:w-1/3">
                            <img src={student.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                            <div>
                                <h4 className="font-bold text-gray-800">{student.name}</h4>
                                <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                        </div>

                        {/* Risk Factors */}
                        <div className="flex gap-4 text-xs w-full md:w-1/3 justify-center">
                            <div className="text-center">
                                <span className="block font-bold text-gray-700">{student.factors.daysInactive} days</span>
                                <span className="text-gray-400">Inactive</span>
                            </div>
                            <div className="text-center">
                                <span className={`block font-bold ${student.factors.avgScore < 50 ? 'text-red-500' : 'text-yellow-500'}`}>
                                    {student.factors.avgScore}%
                                </span>
                                <span className="text-gray-400">Avg Score</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-gray-700">{student.factors.completionRate}%</span>
                                <span className="text-gray-400">Completion</span>
                            </div>
                        </div>

                        {/* Risk Score & Action */}
                        <div className="w-full md:w-1/3 flex items-center justify-end gap-4">
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-400 uppercase">Risk Level</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className={`h-2.5 rounded-full ${student.riskScore > 80 ? 'bg-red-600' : 'bg-orange-400'}`} 
                                            style={{ width: `${student.riskScore}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-bold text-red-600">{student.riskScore}%</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => toast.info(`Reminder email sent to ${student.name}`)}
                                className="bg-white border border-gray-300 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-50"
                            >
                                Notify
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PredictiveAnalytics;