import React from 'react';
import { BookOpen, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">QuizMaster</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Create engaging quizzes and challenge your knowledge. The ultimate platform for educators, 
              students, and quiz enthusiasts to learn and have fun.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/quizzes" className="hover:text-white transition-colors duration-200">Browse Quizzes</a></li>
              <li><a href="/create" className="hover:text-white transition-colors duration-200">Create Quiz</a></li>
              <li><a href="/leaderboard" className="hover:text-white transition-colors duration-200">Leaderboard</a></li>
              <li><a href="/about" className="hover:text-white transition-colors duration-200">About Us</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/help" className="hover:text-white transition-colors duration-200">Help Center</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 QuizMaster. All rights reserved.
          </p>
          <div className="flex items-center space-x-1 text-gray-400 text-sm mt-4 md:mt-0">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for learning</span>
          </div>
        </div>
      </div>
    </footer>
  );
}