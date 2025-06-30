import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  total_questions: number;
  total_attempts: number;
  average_score: number;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

const categories = [
  'All Categories',
  'Science',
  'History',
  'Mathematics',
  'Literature',
  'Geography',
  'Technology',
  'Sports',
  'Entertainment',
  'General Knowledge'
];

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      // First fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;

      // Then fetch creator names for each quiz
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

      setQuizzes(quizzesWithCreators);
    } catch (error: any) {
      toast.error('Failed to fetch quizzes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes
    .filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || quiz.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.total_attempts - a.total_attempts;
        case 'rating':
          return b.average_score - a.average_score;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Quizzes</h1>
            <p className="text-xl text-gray-600">
              Discover and take amazing quizzes created by our community
            </p>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </Card>

          {/* Quiz Grid */}
          {filteredQuizzes.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'All Categories'
                  ? 'Try adjusting your search criteria'
                  : 'Be the first to create a quiz!'}
              </p>
              <Link to="/create">
                <Button>Create Your First Quiz</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                            {quiz.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {quiz.description}
                          </p>
                        </div>
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                          {quiz.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {quiz.total_questions} questions
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {quiz.total_attempts} attempts
                          </div>
                        </div>
                        {quiz.average_score > 0 && (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            {quiz.average_score.toFixed(1)}%
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          by {quiz.creator_name}
                        </div>
                        <Link to={`/quiz/${quiz.id}`}>
                          <Button size="sm">Take Quiz</Button>
                        </Link>
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