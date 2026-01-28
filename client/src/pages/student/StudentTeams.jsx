import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';
import { assets } from '../../assets/assets';

const StudentTeams = () => {
    const { courseId } = useParams();
    const { backendUrl, getToken } = useContext(AppContext);
    const navigate = useNavigate();

    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyGroups = async () => {
            try {
                const token = await getToken();
                const { data } = await axios.get(backendUrl + `/api/group/my-groups/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data.success) {
                    setMyGroups(data.groups);
                }
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        fetchMyGroups();
    }, [courseId, backendUrl, getToken]);

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/my-enrollments')} className="text-gray-500 mb-6 flex items-center gap-2 hover:text-gray-800 transition">
                    ← Back to Enrollments
                </button>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Teams & Activities</h1>
                <p className="text-gray-500 mb-10">View your assigned groups for class activities.</p>

                {myGroups.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📂</div>
                        <h3 className="text-lg font-semibold text-gray-700">No Teams Assigned Yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">Your teacher hasn't added you to any activity groups for this course yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myGroups.map((group) => (
                            <div key={group._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group">
                                {/* Header: Activity Name */}
                                <div className="bg-indigo-600 p-4 flex justify-between items-start">
                                    <div>
                                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide">Activity</p>
                                        <h3 className="text-white font-bold text-lg">{group.batchTitle}</h3>
                                    </div>
                                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                        {new Date(group.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Body: Your Team */}
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                        <span className="text-gray-500 text-sm font-medium">Assigned To</span>
                                        <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm">
                                            {group.groupName}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {group.members.map((member, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${member.userId === group.userId ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-white bg-gray-100 text-gray-500'}`}>
                                                    {member.studentImage ? 
                                                        <img src={member.studentImage} alt="" className="w-full h-full rounded-full object-cover"/> 
                                                        : member.studentName?.[0]}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${member.studentName === "You" ? 'text-indigo-700' : 'text-gray-700'}`}>
                                                        {member.studentName}
                                                    </p>
                                                    {/* Optional: Show roles or scores if needed */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentTeams;