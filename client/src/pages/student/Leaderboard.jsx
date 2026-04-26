import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import Footer from '../../components/student/Footer';

const Leaderboard = () => {
    const { backendUrl, userData } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/leaderboard');
            if (data.success) {
                setLeaderboard(data.leaderboard);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    if (loading) return <Loading />;

    const medals = ['🥇', '🥈', '🥉'];
    const podiumColors = [
      'from-amber-400 to-amber-500 border-amber-300',
      'from-surface-300 to-surface-400 border-surface-300',
      'from-orange-300 to-orange-400 border-orange-300'
    ];

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col">
            <div className="flex-grow section-container pt-10 pb-20 animate-fade-in">
                
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="badge-primary mb-3 inline-flex">Leaderboard</span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight">🏆 Hall of Fame</h1>
                    <p className="text-surface-500 mt-3 text-base">Top students earning XP by completing quizzes and courses.</p>
                </div>

                {/* Top 3 Podium */}
                <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-14 px-4">
                    {[1, 0, 2].map((rank) => {
                      const user = leaderboard[rank];
                      if (!user) return null;
                      const isFirst = rank === 0;
                      
                      return (
                        <div 
                          key={rank}
                          className={`premium-card w-full md:w-1/3 flex flex-col items-center p-6 ${isFirst ? 'md:-translate-y-4 z-10 ring-2 ring-amber-200' : ''} animate-fade-in-up`}
                          style={{animationDelay: `${rank * 0.15}s`}}
                        >
                          {isFirst && <div className="text-3xl mb-2 animate-float">👑</div>}
                          <div className={`w-${isFirst ? '20' : '16'} h-${isFirst ? '20' : '16'} rounded-full overflow-hidden ring-4 ring-offset-2 mb-3 ${isFirst ? 'ring-amber-300' : rank === 1 ? 'ring-surface-300' : 'ring-orange-300'}`}>
                            <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <div className={`badge mb-2 ${rank === 0 ? 'bg-amber-100 text-amber-700' : rank === 1 ? 'bg-surface-200 text-surface-600' : 'bg-orange-100 text-orange-700'}`}>
                            {rank === 0 ? '#1 Champion' : `#${rank + 1}`}
                          </div>
                          <h3 className={`font-bold text-surface-900 truncate max-w-[150px] ${isFirst ? 'text-lg' : 'text-base'}`}>{user.name}</h3>
                          <p className={`font-mono font-bold mt-1 ${rank === 0 ? 'text-amber-600' : 'text-surface-500'}`}>
                            {user.gamification.points} XP
                          </p>
                        </div>
                      );
                    })}
                </div>

                {/* Rest of the List */}
                <div className="premium-card overflow-hidden max-w-3xl mx-auto">
                    {leaderboard.slice(3).map((user, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 border-b border-surface-100 last:border-0 hover:bg-surface-50 transition ${userData && userData._id === user._id ? "bg-brand-50 border-l-4 border-l-brand-500" : ""}`}>
                            <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-surface-400 w-6 text-right text-sm">{index + 4}</span>
                                <img src={user.imageUrl} alt="" className="w-9 h-9 rounded-full ring-2 ring-surface-100" />
                                <span className={`font-medium text-sm ${userData && userData._id === user._id ? "text-brand-700 font-bold" : "text-surface-700"}`}>
                                    {user.name} {userData && userData._id === user._id && <span className="badge-primary ml-1">You</span>}
                                </span>
                            </div>
                            <span className="font-mono font-semibold text-surface-600 text-sm">
                                {user.gamification.points} XP
                            </span>
                        </div>
                    ))}
                    
                    {leaderboard.length === 0 && (
                        <div className="p-12 text-center">
                          <div className="text-4xl mb-3">🏅</div>
                          <p className="text-surface-400">No players on the leaderboard yet. Be the first!</p>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Leaderboard;