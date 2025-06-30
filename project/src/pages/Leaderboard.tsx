import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  total_score: number;
  quiz_count: number;
  average_score: number;
  rank: number;
}

interface TopQuiz {
  id: string;
  title: string;
  category: string;
  total_attempts: number;
  average_score: number;
  created_by: string;
  creator_name: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topQuizzes, setTopQuizzes] = useState<TopQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Fetch user leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .rpc('get_user_leaderboard', { time_filter: timeframe });

      if (leaderboardError) throw leaderboardError;

      // Fetch top quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_published', true)
        .order('total_attempts', { ascending: false })
        .limit(10);

      if (quizzesError) throw quizzesError;

      // Fetch creator names for each quiz
      const quizzesWithCreators = await Promise.all(
        (quizzesData || []).map(async (quiz) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', quiz.created_by)
            .single();

          return {
            ...quiz,
            creator_name: profileData?.full_name || 'Unknown'
          };
        })
      );

      setLeaderboard(leaderboardData || []);
      setTopQuizzes(quizzesWithCreators);
    } catch (error: any) {
      toast.error('Failed to load leaderboard data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-gray-600">{rank}</span>
          </div>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Leaderboard</h1>
            <p className="text-xl text-gray-600">
              See who's leading the quiz challenge!
            </p>
          </div>

          {/* Timeframe Filter */}
          <Card className="p-6 mb-8">
            <div className="flex justify-center space-x-4">
              {[
                { key: 'all', label: 'All Time' },
                { key: 'month', label: 'This Month' },
                { key: 'week', label: 'This Week' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeframe(key as any)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    timeframe === key
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Leaderboard */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-primary-600" />
                Top Quiz Takers
              </h2>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No quiz attempts yet for this timeframe</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.slice(0, 10).map((entry, index) => (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center p-4 rounded-lg ${getRankBadge(entry.rank)}`}
                    >
                      <div className="mr-4">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold">{entry.full_name}</h3>
                        <div className="text-sm opacity-90">
                          {entry.quiz_count} quizzes • {entry.average_score.toFixed(1)}% avg
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">{entry.total_score}</div>
                        <div className="text-sm opacity-90">points</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Quizzes */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Star className="h-6 w-6 mr-2 text-yellow-500" />
                Most Popular Quizzes
              </h2>

              {topQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No published quizzes yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topQuizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-sm font-bold text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {quiz.title}
                        </h3>
                        <div className="text-sm text-gray-600">
                          by {quiz.creator_name} • {quiz.category}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {quiz.total_attempts}
                        </div>
                        <div className="text-sm text-gray-500">attempts</div>
                        {quiz.average_score > 0 && (
                          <div className="text-sm text-yellow-600">
                            ⭐ {quiz.average_score.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Achievement Badges */}
          <Card className="p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Achievement Levels
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Beginner', min: 0, max: 100, color: 'bg-gray-100 text-gray-700', icon: '🌱' },
                { title: 'Intermediate', min: 101, max: 500, color: 'bg-blue-100 text-blue-700', icon: '📚' },
                { title: 'Advanced', min: 501, max: 1000, color: 'bg-purple-100 text-purple-700', icon: '🎓' },
                { title: 'Expert', min: 1001, max: Infinity, color: 'bg-yellow-100 text-yellow-700', icon: '👑' }
              ].map((level, index) => (
                <motion.div
                  key={level.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-lg text-center ${level.color}`}
                >
                  <div className="text-4xl mb-2">{level.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{level.title}</h3>
                  <p className="text-sm">
                    {level.max === Infinity 
                      ? `${level.min}+ points`
                      : `${level.min}-${level.max} points`
                    }
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}