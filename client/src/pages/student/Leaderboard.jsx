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
            // Note: This endpoint must be public or allowed for students
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="flex-grow max-w-4xl mx-auto w-full px-4 pt-10 pb-20">
                
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Hall of Fame</h1>
                    <p className="text-gray-500">Top students earning XP by completing quizzes and courses.</p>
                </div>

                {/* Top 3 Cards (Podium) */}
                <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-gray-300 w-full md:w-1/3 flex flex-col items-center order-2 md:order-1">
                            <div className="w-16 h-16 rounded-full border-4 border-gray-300 overflow-hidden mb-3">
                                <img src={leaderboard[1].imageUrl} alt="User" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-gray-200 text-gray-600 font-bold px-3 py-1 rounded-full text-sm mb-2">#2</div>
                            <h3 className="font-bold text-gray-800 truncate max-w-[120px]">{leaderboard[1].name}</h3>
                            <p className="text-gray-500 font-mono text-sm">{leaderboard[1].gamification.points} XP</p>
                        </div>
                    )}

                    {/* 1st Place */}
                    {leaderboard[0] && (
                        <div className="bg-white p-8 rounded-2xl shadow-xl border-b-4 border-yellow-400 w-full md:w-1/3 flex flex-col items-center order-1 md:order-2 transform md:-translate-y-4 z-10 relative">
                             <div className="absolute -top-6 text-4xl">👑</div>
                            <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden mb-4">
                                <img src={leaderboard[0].imageUrl} alt="User" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-yellow-100 text-yellow-700 font-bold px-4 py-1 rounded-full text-sm mb-2">#1 Champion</div>
                            <h3 className="font-bold text-xl text-gray-800 truncate max-w-[150px]">{leaderboard[0].name}</h3>
                            <p className="text-yellow-600 font-mono font-bold">{leaderboard[0].gamification.points} XP</p>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                        <div className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-orange-300 w-full md:w-1/3 flex flex-col items-center order-3">
                            <div className="w-16 h-16 rounded-full border-4 border-orange-300 overflow-hidden mb-3">
                                <img src={leaderboard[2].imageUrl} alt="User" className="w-full h-full object-cover" />
                            </div>
                            <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm mb-2">#3</div>
                            <h3 className="font-bold text-gray-800 truncate max-w-[120px]">{leaderboard[2].name}</h3>
                            <p className="text-gray-500 font-mono text-sm">{leaderboard[2].gamification.points} XP</p>
                        </div>
                    )}
                </div>

                {/* The Rest of the List (4-10) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {leaderboard.slice(3).map((user, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition ${userData && userData._id === user._id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`}>
                            <div className="flex items-center gap-4">
                                <span className="font-mono font-bold text-gray-400 w-6 text-right">{index + 4}</span>
                                <img src={user.imageUrl} alt="" className="w-10 h-10 rounded-full bg-gray-100" />
                                <span className={`font-medium ${userData && userData._id === user._id ? "text-blue-700 font-bold" : "text-gray-700"}`}>
                                    {user.name} {userData && userData._id === user._id && "(You)"}
                                </span>
                            </div>
                            <div className="font-mono font-semibold text-gray-600">
                                {user.gamification.points} XP
                            </div>
                        </div>
                    ))}
                    
                    {leaderboard.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No players on the leaderboard yet. Be the first!</div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Leaderboard;