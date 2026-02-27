import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Leaderboard from "../components/Leaderboard";
import { Section } from "../components/Layout";
import { Button, Card, Badge } from "../components/ui";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BookOpen, ThumbsUp, MessageSquare, Inbox, Hexagon, FileText, TrendingUp, Plus } from "lucide-react";

const API_BASE = '/api';

export default function CuratedArticlesPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}/articles/all`);
      setArticles(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article) => {
    const articleId = article.id || article._id;
    if (articleId) navigate(`/curated/${articleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' fill='none'/%3E%3C/svg%3E")` }}
      />
      
      <Navbar />
      
      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Section className="py-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Intelligence Layer</h1>
                </div>
                <p className="text-zinc-400 max-w-xl mt-2">
                  Curated insights from the decentralized web. Verified by community, stored on Arbitrum.
                </p>
              </div>
              
              <div className="flex gap-6">
                <div className="flex flex-col items-end px-4 py-2 border-r border-zinc-800">
                  <span className="text-2xl font-bold text-white">{articles.length}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Articles</span>
                </div>
                <div className="flex flex-col items-end px-4 py-2">
                  <span className="text-2xl font-bold text-emerald-400">{articles.reduce((a, b) => a + (b.upvotes || 0), 0)}</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Votes</span>
                </div>
              </div>
            </div>

            <Leaderboard />

            {/* Filters & Actions */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-lg font-bold">
                <BookOpen className="w-5 h-5 text-emerald-400" /> All Entries
              </div>
              <Button onClick={() => navigate('/legacy')} size="sm">
                <Plus className="w-4 h-4" />
                Submit Article
              </Button>
            </div>

            {/* Grid */}
            {error ? (
              <div className="p-8 border border-red-500/30 bg-red-500/5 rounded-xl text-center text-red-400">
                {error}
              </div>
            ) : articles.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-zinc-800 rounded-xl">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 mb-6">No articles found in the registry.</p>
                <Button onClick={() => navigate('/legacy')}>
                  Submit Your First Article
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Card 
                    key={article.id || article._id}
                    variant="interactive"
                    onClick={() => handleArticleClick(article)}
                    className="overflow-hidden flex flex-col p-0"
                  >
                    {/* Image */}
                    <div className="h-48 overflow-hidden relative bg-zinc-900">
                      {article.imageUrl ? (
                        <img 
                          src={article.imageUrl} 
                          alt={article.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-zinc-700" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge color={article.onChain ? "emerald" : "zinc"} className="bg-black/80 backdrop-blur">
                          {article.onChain ? (
                            <>
                              <Hexagon className="w-3 h-3" />
                              On-chain
                            </>
                          ) : (
                            'Draft'
                          )}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">
                        {article.summary}
                      </p>
                      
                      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-mono">
                          {new Date(article.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <ThumbsUp className="w-3.5 h-3.5" /> {article.upvotes || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" /> {article.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
