import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card } from "../components/ui";
import Button from "../components/ui/Button";
import {
  Brain, Search, Scale, Link2, Zap, Shield, Globe, 
  ArrowRight, CheckCircle, Hexagon, BarChart3, 
  FileText, Users, Lock, Sparkles, TrendingUp, Database
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Research Engine",
    description: "Generate comprehensive research reports from 10+ authoritative sources with AI-powered synthesis and analysis.",
    color: "emerald",
    link: "/research",
  },
  {
    icon: FileText,
    title: "Article Curation",
    description: "Curate and preserve any web article with AI summarization, stored immutably on IPFS and blockchain.",
    color: "blue",
    link: "/legacy",
  },
  {
    icon: Scale,
    title: "Article Comparator",
    description: "Compare two articles side-by-side with AI scoring across 8 dimensions including credibility and bias.",
    color: "purple",
    link: "/compare",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Input Your Query",
    description: "Enter a research topic, paste an article URL, or provide two URLs to compare.",
    icon: Search,
  },
  {
    step: "02",
    title: "AI Analysis",
    description: "Our AI engine scrapes, analyzes, and synthesizes information from multiple sources.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Review & Curate",
    description: "Review the AI-generated insights and prepare your content for on-chain storage.",
    icon: FileText,
  },
  {
    step: "04",
    title: "Mint On-Chain",
    description: "Store your curated content permanently on IPFS and register it on the blockchain.",
    icon: Hexagon,
  },
];

const PLATFORM_PILLARS = [
  {
    title: "AI Research Engine",
    description: "Multi-source aggregation and AI-powered synthesis for deep research insights.",
    icon: Brain,
  },
  {
    title: "On-Chain Curation",
    description: "Register curated knowledge immutably on blockchain for transparent verification.",
    icon: Hexagon,
  },
  {
    title: "Credibility Scoring",
    description: "Bias detection and credibility analysis across multiple evaluation dimensions.",
    icon: Scale,
  },
  {
    title: "IPFS Storage Layer",
    description: "Decentralized storage ensuring permanent and censorship-resistant access.",
    icon: Database,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-radial from-emerald-500/8 via-transparent to-transparent rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
            {/* Left Column - Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  Web3 AI-Powered Curation Platform
                </span>
              </div>

              <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.01]">
                <span className="block type-line line-1">
                    Decentralized
                </span>

                <span className="block text-emerald-400 type-line line-2">
                    Intelligence
                </span>

                <span className="block type-line line-3 cursor-line">
                    Layer.
                </span>
              </h1>

              <p className="text-xl text-zinc-400 leading-relaxed mb-10 max-w-lg">
                Research, curate, and verify web content with AI-powered analysis. 
                Store findings immutably on IPFS and blockchain for permanent, 
                transparent access.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/research")}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Start Researching
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate("/research-list")}
                >
                  Explore Reports
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Verified On-Chain</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>IPFS Storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>AI-Powered</span>
                </div>
              </div>
            </div>

            {/* Right Column - 3D Model Placeholder */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-[600px] mx-auto">
                {/* Placeholder container for future 3D model */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/50 to-transparent border border-zinc-800/50 overflow-hidden">
                  {/* Animated background elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      {/* Orbiting elements */}
                      <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-spin-slow" />
                      <div className="absolute inset-4 rounded-full border border-emerald-500/15 animate-spin-slow-reverse" />
                      <div className="absolute inset-8 rounded-full border border-emerald-500/10" />
                      
                      {/* Center hexagon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                          <Hexagon className="w-12 h-12 text-emerald-400" />
                        </div>
                      </div>

                      {/* Floating elements */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center animate-float">
                        <Brain className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center animate-float-delayed">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center animate-float">
                        <Scale className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center animate-float-delayed">
                        <Database className="w-4 h-4 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pillars */}
        <section className="relative z-10 py-20 border-y border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
        <div className="w-full px-6 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PLATFORM_PILLARS.map((item, idx) => (
                <div
                key={idx}
                className="group text-center p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/40 transition-all duration-300"
                >
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                </h3>

                <p className="text-sm text-zinc-500 leading-relaxed">
                    {item.description}
                </p>
                </div>
            ))}
            </div>
        </div>
        </section>

      {/* Features Section */}
      <section className="relative z-10 py-32" id="features">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Three Powerful Tools
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Choose your workflow. Generate research, curate articles, or compare content — all secured on-chain.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <Card
                key={idx}
                variant="interactive"
                padding="lg"
                className="group relative overflow-hidden"
                onClick={() => navigate(feature.link)}
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${
                  feature.color === 'emerald' ? 'from-emerald-500/10' :
                  feature.color === 'blue' ? 'from-blue-500/10' :
                  'from-purple-500/10'
                } to-transparent`} />
                
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 border ${
                    feature.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 group-hover:bg-emerald-500/20' :
                    feature.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 group-hover:bg-blue-500/20' :
                    'bg-purple-500/10 border-purple-500/30 group-hover:bg-purple-500/20'
                  }`}>
                    <feature.icon className={`w-8 h-8 ${
                      feature.color === 'emerald' ? 'text-emerald-400' :
                      feature.color === 'blue' ? 'text-blue-400' :
                      'text-purple-400'
                    }`} />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:gap-3 transition-all">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-32 bg-zinc-900/30" id="workflow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Four simple steps from query to permanent on-chain record
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            {WORKFLOW_STEPS.map((step, idx) => (
              <div key={idx} className="relative">
                <Card
                  variant="default"
                  padding="lg"
                  className="text-center relative group hover:border-emerald-500/30 transition-all duration-300"
                >
                  {/* Step number */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-sm border-4 border-[#050505]">
                    {step.step}
                  </div>

                  <div className="pt-4">
                    <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-300 border border-zinc-700 group-hover:border-emerald-500/30">
                      <step.icon className="w-7 h-7 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card 
            variant="default" 
            padding="lg"
            className="text-center bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-emerald-500/20"
          >
            <div className="py-8">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Get Started Today
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to curate the web?
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
                Join the decentralized intelligence layer. Research, verify, and preserve 
                knowledge on-chain.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/research")}
                  icon={Brain}
                >
                  AI Research
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => navigate("/compare")}
                  icon={Scale}
                >
                  Compare Articles
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate("/legacy")}
                  icon={Link2}
                >
                  Curate URL
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />

      {/* Custom animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-10px) translateX(-50%); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(10px) translateX(-50%); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
