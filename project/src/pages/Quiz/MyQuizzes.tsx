import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Users, BarChart3, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  is_published: boolean;
  total_questions: number;
  total_attempts: number;
  average_score: number;
  created_at: string;
  updated_at: string;
}

export default function MyQuizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (user) {
      fetchMyQuizzes();
    }
  }, [user]);

  const fetchMyQuizzes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch your quizzes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete questions first
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);

      if (questionsError) throw questionsError;

      // Delete quiz attempts
      const { error: attemptsError } = await supabase
        .from('quiz_attempts')
        .delete()
        .eq('quiz_id', quizId);

      if (attemptsError) throw attemptsError;

      // Delete quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (quizError) throw quizError;

      toast.success('Quiz deleted successfully');
      fetchMyQuizzes();
    } catch (error: any) {
      toast.error('Failed to delete quiz');
      console.error('Error:', error);
    }
  };

  const togglePublishStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: !currentStatus })
        .eq('id', quizId);

      if (error) throw error;

      toast.success(currentStatus ? 'Quiz unpublished' : 'Quiz published');
      fetchMyQuizzes();
    } catch (error: any) {
      toast.error('Failed to update quiz status');
      console.error('Error:', error);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    if (filter === 'published') return quiz.is_published;
    if (filter === 'draft') return !quiz.is_published;
    return true;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your quizzes.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Quizzes</h1>
              <p className="text-xl text-gray-600">Manage your created quizzes</p>
            </div>
            <Link to="/create">
              <Button icon={Plus}>Create New Quiz</Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-8">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({quizzes.length})
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'published'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Published ({quizzes.filter(q => q.is_published).length})
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'draft'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Drafts ({quizzes.filter(q => !q.is_published).length})
              </button>
            </div>
          </Card>

          {/* Quiz List */}
          {filteredQuizzes.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No quizzes yet' : `No ${filter} quizzes`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Create your first quiz to get started!'
                  : `You don't have any ${filter} quizzes yet.`
                }
              </p>
              <Link to="/create">
                <Button>Create Your First Quiz</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card hover className="h-full">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {quiz.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              quiz.is_published
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {quiz.is_published ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {quiz.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {quiz.total_questions}
                          </div>
                          <div className="text-xs text-gray-500">Questions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {quiz.total_attempts}
                          </div>
                          <div className="text-xs text-gray-500">Attempts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {quiz.average_score > 0 ? `${quiz.average_score.toFixed(0)}%` : '-'}
                          </div>
                          <div className="text-xs text-gray-500">Avg Score</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDistanceToNow(new Date(quiz.updated_at), { addSuffix: true })}
                        </div>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {quiz.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Link to={`/quiz/${quiz.id}/edit`}>
                            <Button variant="outline" size="sm" icon={Edit}>
                              Edit
                            </Button>
                          </Link>
                          {quiz.is_published && (
                            <Link to={`/quiz/${quiz.id}`}>
                              <Button variant="outline" size="sm" icon={Eye}>
                                View
                              </Button>
                            </Link>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePublishStatus(quiz.id, quiz.is_published)}
                          >
                            {quiz.is_published ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuiz(quiz.id)}
                            className="text-red-600 hover:text-red-700"
                            icon={Trash2}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}