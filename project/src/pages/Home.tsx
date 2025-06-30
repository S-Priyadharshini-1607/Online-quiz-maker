import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Play, Users, Trophy, Clock, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: Plus,
      title: 'Create Quizzes',
      description: 'Build engaging quizzes with multiple choice questions, explanations, and custom categories.',
    },
    {
      icon: Play,
      title: 'Take Quizzes',
      description: 'Challenge yourself with quizzes from the community and track your progress.',
    },
    {
      icon: Trophy,
      title: 'Compete & Win',
      description: 'Climb the leaderboards and earn recognition for your knowledge.',
    },
    {
      icon: Clock,
      title: 'Real-time Results',
      description: 'Get instant feedback with detailed explanations and performance analytics.',
    },
  ];

  const stats = [
    { label: 'Active Quizzes', value: '10,000+', icon: BookOpen },
    { label: 'Quiz Takers', value: '50,000+', icon: Users },
    { label: 'Questions Answered', value: '1M+', icon: Star },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-6">
              Master Every Quiz
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Create engaging quizzes, challenge your knowledge, and compete with learners worldwide. 
              The ultimate platform for interactive learning.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {user ? (
                <>
                  <Link to="/create">
                    <Button size="lg" icon={Plus}>
                      Create Your First Quiz
                    </Button>
                  </Link>
                  <Link to="/quizzes">
                    <Button variant="outline" size="lg" icon={Play}>
                      Browse Quizzes
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link to="/quizzes">
                    <Button variant="outline" size="lg" icon={Play}>
                      Try Sample Quiz
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {stats.map(({ label, value, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
                  <div className="text-gray-600">{label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Amazing Quizzes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools and features designed to make quiz creation effortless and quiz-taking engaging.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="p-6 h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Your Quiz Journey?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of educators and learners who are already creating and taking amazing quizzes.
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button variant="secondary" size="lg">
                    Sign Up Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}