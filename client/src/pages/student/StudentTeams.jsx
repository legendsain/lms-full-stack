import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/student/Loading';
import Footer from '../../components/student/Footer';

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
        <div className="min-h-screen bg-surface-50 flex flex-col">
          <div className="flex-grow section-container pt-10 pb-20 animate-fade-in">
            <button onClick={() => navigate('/my-enrollments')} className="btn-ghost mb-6 !px-0 gap-2 text-surface-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back to Enrollments
            </button>

            <div className="max-w-4xl">
              <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">My Teams & Activities</h1>
              <p className="text-surface-500 mt-2 mb-10">View your assigned groups for class activities.</p>

              {myGroups.length === 0 ? (
                <div className="text-center py-20 premium-card">
                  <div className="text-4xl mb-3">📂</div>
                  <h3 className="text-lg font-semibold text-surface-700">No Teams Assigned Yet</h3>
                  <p className="text-surface-500 max-w-sm mx-auto mt-2 text-sm">Your teacher hasn't added you to any activity groups for this course yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myGroups.map((group) => (
                    <div key={group._id} className="premium-card overflow-hidden hover-lift animate-fade-in-up">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-brand-600 to-violet-600 p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Activity</p>
                            <h3 className="text-white font-bold text-lg mt-0.5">{group.batchTitle}</h3>
                          </div>
                          <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
                            {new Date(group.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-surface-100">
                          <span className="text-sm text-surface-500">Your Group</span>
                          <span className="badge-primary font-bold">{group.groupName}</span>
                        </div>

                        <div className="space-y-3">
                          {group.members.map((member, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${
                                member.userId === group.userId 
                                  ? 'ring-2 ring-brand-400' 
                                  : 'ring-2 ring-surface-200'
                              }`}>
                                {member.studentImage 
                                  ? <img src={member.studentImage} alt="" className="w-full h-full object-cover" /> 
                                  : <div className="w-full h-full bg-surface-100 flex items-center justify-center text-surface-500">{member.studentName?.[0]}</div>
                                }
                              </div>
                              <span className={`text-sm font-medium ${
                                member.studentName === "You" ? 'text-brand-700' : 'text-surface-700'
                              }`}>
                                {member.studentName}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Chat Button */}
                        <div className="mt-5 pt-4 border-t border-surface-100">
                          <button 
                            onClick={() => navigate(`/team/chat/${group._id}`)}
                            className="w-full btn-primary !bg-brand-600 hover:!bg-brand-700 flex justify-center items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                            Open Team Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
    );
};

export default StudentTeams;