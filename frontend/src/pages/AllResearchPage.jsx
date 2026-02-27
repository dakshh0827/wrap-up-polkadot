import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Section } from "../components/Layout";
import { Button, Card, Badge } from "../components/ui";
import axios from "axios";
import { Brain, Calendar, User, ThumbsUp, MessageSquare, Hexagon, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = '/api';

export default function AllResearchPage() {
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResearch();
  }, [page]);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/research?page=${page}&limit=12`);
      setResearch(response.data.research);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load research:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading research reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Section className="py-12">
            {/* Header */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">Research Reports</h1>
                  <p className="text-zinc-400 text-sm mt-1">
                    Explore comprehensive AI-generated research reports across multiple topics
                  </p>
                </div>
              </div>
            </div>

            {research.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-lg mb-6">No research reports yet. Be the first to create one!</p>
                <Button onClick={() => navigate('/research')}>
                  Create Research Report
                </Button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {research.map((report) => (
                    <Card
                      key={report.id}
                      variant="interactive"
                      onClick={() => navigate(`/research/${report.id}`)}
                      className="p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                            {report.topic}
                          </h3>
                        </div>
                        {report.onChain && (
                          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                            <Hexagon className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <p className="text-zinc-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {report.executiveSummary}
                      </p>

                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Badge color="blue" className="py-0.5">
                          <TrendingUp className="w-3 h-3" />
                          {report.metadata?.totalSources || 0} sources
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{report.upvotes}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MessageSquare className="w-4 h-4" />
                            <span>{report.commentCount || 0}</span>
                          </div>
                        </div>

                        {report.curatorName && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <User className="w-3.5 h-3.5" />
                            <span>{report.curatorName}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={i}
                            onClick={() => setPage(pageNum)}
                            className={`w-10 h-10 rounded-xl font-bold transition-all ${
                              page === pageNum
                                ? 'bg-emerald-500 text-black'
                                : 'bg-zinc-900 border border-zinc-800 text-white hover:border-emerald-500/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      size="sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
