import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Layout, PageHeader, Section } from "../components/Layout";
import { Button, Card, Input, Badge, StepIndicator } from "../components/ui";
import toast from "react-hot-toast";
import axios from "axios";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { WRAPUP_ABI, CONTRACT_ADDRESSES } from "../wagmiConfig";
import { decodeEventLog } from "viem";
import { 
  Brain, Sparkles, Search, BarChart3, 
  Globe, Zap, X, ArrowRight, CheckCircle, Circle, Loader, Scale, Link2
} from "lucide-react";

const API_BASE = '/api';

const STEPS = ["Save to DB", "Upload IPFS", "Sign & Mint"];

export default function ResearchLandingPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("idle"); 
  const navigate = useNavigate();

  // Curation flow states
  const [researchPreview, setResearchPreview] = useState(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [savedResearch, setSavedResearch] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [txDone, setTxDone] = useState(false);

  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const currentContractAddress = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[421614];

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({ hash });

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!topic.trim() || topic.trim().length < 5) {
      toast.error("Please enter a topic (at least 5 characters)");
      return;
    }

    setLoading(true);
    setStage("searching");
    setResearchPreview(null);
    setSavedResearch(null);
    setIpfsHash(null);
    setTxDone(false);
    setStepIndex(-1);
    
    const loadingToast = toast.loading("Initializing AI research engine...");

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStage("analyzing");
      toast.loading("Analyzing multiple sources...", { id: loadingToast });
      
      const response = await axios.post(`${API_BASE}/research/generate`, {
        topic: topic.trim()
      });

      setStage("complete");
      toast.success("AI Analysis Complete!", { id: loadingToast });

      if (response.data.cached && response.data.previewOnly === false) {
        navigate(`/research/${response.data.researchId}`);
      } else {
        setResearchPreview(response.data.report || response.data.preview);
      }
    } catch (error) {
      console.error("Research error:", error);
      toast.error(
        error.response?.data?.error || "Research failed. Please try again.",
        { id: loadingToast }
      );
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleCurate = async () => {
    if (!researchPreview) return;
    if (!isConnected) {
      toast.error("Connect wallet to curate");
      return;
    }

    setLoading(true);
    setTxDone(false);

    try {
      // STEP 1: Save to Database
      setStepIndex(0);
      const tid1 = toast.loading("Step 1/3 — Saving to database...");
      const res = await axios.post(`${API_BASE}/research/generate`, {
        action: 'prepare',
        reportData: researchPreview
      });
      const dbResearch = res.data.report;
      setSavedResearch(dbResearch);
      toast.success("Saved to database!", { id: tid1 });

      // STEP 2: Upload to IPFS
      setStepIndex(1);
      const tid2 = toast.loading("Step 2/3 — Uploading to IPFS...");
      const ipfsRes = await axios.post(`${API_BASE}/research/upload-ipfs`, {
        researchId: dbResearch.id,
      });
      const generatedHash = ipfsRes.data.ipfsHash;
      if (!generatedHash) throw new Error("IPFS upload failed — no hash returned");
      setIpfsHash(generatedHash);
      toast.success("Uploaded to IPFS!", { id: tid2 });

      // STEP 3: Submit to Blockchain
      setStepIndex(2);
      toast.loading("Step 3/3 — Sign transaction in wallet...", { id: "mintToast" });

      const doWrite = () => {
        writeContract({
          address: currentContractAddress,
          abi: WRAPUP_ABI,
          functionName: "submitArticle",
          args: [generatedHash],
        });
      };

      if (!CONTRACT_ADDRESSES[chainId]) {
        switchChain(
          { chainId: 421614 },
          {
            onSuccess: doWrite,
            onError: () => {
              toast.error("Network switch failed", { id: "mintToast" });
              setLoading(false);
              setStepIndex(-1);
            },
          }
        );
      } else {
        doWrite();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Curation failed");
      if (savedResearch?.id) {
        await axios.delete(`${API_BASE}/research/${savedResearch.id}`).catch(() => {});
        setSavedResearch(null);
      }
      setStepIndex(-1);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPending) toast.loading("Waiting for wallet confirmation...", { id: "mintToast" });
    if (isConfirming) { setStepIndex(2); toast.loading("Confirming on blockchain...", { id: "mintToast" }); }

    if (isConfirmed && receipt && ipfsHash && savedResearch) {
      let onChainId = null;
      try {
        for (const log of receipt.logs) {
          const event = decodeEventLog({
            abi: WRAPUP_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (event.eventName === "ArticleSubmitted") {
            onChainId = event.args.articleId.toString();
            break;
          }
        }
      } catch {}

      if (onChainId && address) {
        toast.loading("Finalizing on-chain record...", { id: "mintToast" });
        axios.post(`${API_BASE}/research/mark-onchain`, {
          researchId: savedResearch.id,
          blockchainId: onChainId,
          curator: address,
          ipfsHash
        }).then(() => {
          setStepIndex(3);
          setTxDone(true);
          toast.success("Research curated on-chain!", { id: "mintToast" });
          setLoading(false);
          setTimeout(() => navigate(`/research/${savedResearch.id}`), 2000);
        }).catch((err) => {
          toast.error("DB sync failed: " + err.message, { id: "mintToast" });
          setLoading(false);
        });
      } else {
        setStepIndex(3);
        setTxDone(true);
        toast.success("Research minted!", { id: "mintToast" });
        setLoading(false);
        setTimeout(() => navigate(`/research/${savedResearch.id}`), 2000);
      }
    }

    if (isTxError || writeError) {
      toast.error("Transaction failed or rejected.", { id: "mintToast" });
      if (savedResearch?.id) {
        axios.delete(`${API_BASE}/research/${savedResearch.id}`).catch(() => {});
        setSavedResearch(null);
      }
      setStepIndex(-1);
      setLoading(false);
    }
  }, [isPending, isConfirming, isConfirmed, isTxError, receipt, writeError, txError, savedResearch, ipfsHash, address, navigate]);

  const handleReset = () => {
    setTopic("");
    setResearchPreview(null);
    setSavedResearch(null);
    setIpfsHash(null);
    setTxDone(false);
    setStepIndex(-1);
    setStage("idle");
  };

  const getStageMessage = () => {
    switch (stage) {
      case "searching": return "Searching across 10+ platforms...";
      case "analyzing": return "Analyzing sources and synthesizing insights...";
      case "complete": return "Preview ready for curation!";
      default: return "";
    }
  };

  const isProcessing = loading || isPending || isConfirming;
  
  const getButtonLabel = () => {
    if (stepIndex === -1 && !loading) return "Curate & Mint Report";
    if (stepIndex === 0) return "Saving to DB...";
    if (stepIndex === 1) return "Uploading to IPFS...";
    if (stepIndex === 2 && (isPending || isConfirming)) return "Confirming on Chain...";
    if (txDone) return "Done! Redirecting...";
    return "Curate & Mint Report";
  };

  const features = [
    { icon: Globe, title: "10+ Sources", desc: "Web, Twitter, Reddit, News, & Papers.", color: "text-blue-400" },
    { icon: Zap, title: "Extraction", desc: "Clean content filtering & noise removal.", color: "text-yellow-400" },
    { icon: Brain, title: "Analysis", desc: "Deep AI synthesis & consensus mapping.", color: "text-emerald-400" },
    { icon: BarChart3, title: "Visuals", desc: "Sentiment analysis & credibility scoring.", color: "text-purple-400" }
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' fill='none'/%3E%3C/svg%3E")` }} 
      />
      
      <Navbar />

      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          
          {/* Hero & Search - Only show if NOT in preview mode */}
          {!researchPreview && (
            <Section className="pt-20 pb-8">
              {/* Hero */}
              <div className="text-center mb-12">
                <Badge className="mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  Deep Engine v2.0
                </Badge>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                  Multi-Source{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                    Research.
                  </span>
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                  Get comprehensive, AI-synthesized research reports from 10+ authoritative sources. 
                  Identify consensus, contradictions, and insights in seconds.
                </p>
              </div>

              {/* Wallet Buttons */}
              <div className="flex items-center justify-center gap-4 mb-10">
                <w3m-button />
                <w3m-network-button />
              </div>

              {/* Search Form */}
              <div className="max-w-3xl mx-auto mb-8">
                <form 
                  onSubmit={handleResearch} 
                  className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex flex-col sm:flex-row gap-3 shadow-2xl shadow-black/50 transition-all hover:border-zinc-700 focus-within:border-emerald-500/50"
                >
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your research topic... (e.g., 'Impact of AI on healthcare')"
                    className="flex-1 bg-transparent px-6 py-4 text-white placeholder-zinc-600 focus:outline-none text-lg w-full"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || topic.trim().length < 5}
                    size="lg"
                    className="px-8 whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Generate
                      </>
                    )}
                  </Button>
                </form>

                {/* Stage Indicator */}
                {loading && (
                  <div className="mt-6 flex justify-center animate-fade-in">
                    <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-full">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        {getStageMessage()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tool Links */}
              <div className="flex justify-center gap-6 mb-16">
                <button 
                  onClick={() => navigate("/compare")}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                >
                  <Scale className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> 
                  Compare Articles
                </button>
                <button 
                  onClick={() => navigate("/legacy")}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 group"
                >
                  <Link2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> 
                  Curate URL
                </button>
              </div>
            </Section>
          )}

          {/* Preview Panel */}
          {researchPreview && (
            <Section className="py-16">
              <Card variant="elevated" className="max-w-4xl mx-auto overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs text-zinc-400 uppercase">
                      Research Ready to Curate
                    </span>
                  </div>
                  <button 
                    onClick={handleReset} 
                    disabled={isProcessing}
                    className="p-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500 hover:text-white" />
                  </button>
                </div>

                <div className="p-6 md:p-8">
                  {/* Step Indicator */}
                  {stepIndex >= 0 && (
                    <StepIndicator steps={STEPS} currentStep={stepIndex} className="mb-8" />
                  )}

                  {/* Preview Content */}
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                      {researchPreview.topic}
                    </h2>
                    
                    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6">
                      <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
                        Executive Summary (Preview)
                      </h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {researchPreview.executiveSummary?.substring(0, 300)}... 
                        <span className="text-zinc-600 italic ml-2">
                          (Mint to unlock full synthesis, contradictions & visualization data)
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge color="blue">
                        <Globe className="w-3.5 h-3.5" />
                        Synthesized from {researchPreview.metadata?.totalSources || 0} Sources
                      </Badge>
                      <Badge color="purple">
                        <Brain className="w-3.5 h-3.5" />
                        Deep Logic Evaluated
                      </Badge>
                    </div>
                  </div>

                  {/* Status Rows */}
                  <div className="space-y-2 mb-6">
                    {[
                      {
                        label: "Database",
                        done: !!savedResearch,
                        active: stepIndex === 0,
                        value: savedResearch ? `ID: ${savedResearch.id?.slice(-8)}` : null,
                      },
                      {
                        label: "IPFS",
                        done: !!ipfsHash,
                        active: stepIndex === 1,
                        value: ipfsHash ? `${ipfsHash.slice(0, 16)}...` : null,
                      },
                      {
                        label: "Blockchain",
                        done: txDone,
                        active: stepIndex === 2,
                        value: null,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                          row.done
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : row.active
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-zinc-800 bg-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {row.done ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : row.active ? (
                            <Loader className="w-4 h-4 text-emerald-400 animate-spin" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-600" />
                          )}
                          <span className={row.done ? "text-emerald-400" : row.active ? "text-white" : "text-zinc-600"}>
                            {row.label}
                          </span>
                        </div>
                        {row.value && (
                          <span className="font-mono text-[10px] text-zinc-500">{row.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-6 border-t border-zinc-800">
                    <Button
                      onClick={handleCurate}
                      disabled={isProcessing || txDone || !isConnected}
                      size="lg"
                      variant={txDone ? "primary" : "primary"}
                      className={txDone ? "bg-emerald-500 cursor-default" : ""}
                    >
                      {isProcessing && <Loader className="w-4 h-4 animate-spin" />}
                      {!isConnected ? "Connect Wallet to Mint" : getButtonLabel()}
                      {!isProcessing && !txDone && isConnected && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </Section>
          )}

          {/* Feature Grid - Show when not previewing and not loading */}
          {!researchPreview && !loading && (
            <Section className="py-16 border-t border-zinc-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, idx) => (
                  <Card 
                    key={idx} 
                    variant="interactive"
                    className="p-8"
                  >
                    <div className={`w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-emerald-500/50 transition-all`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-zinc-500 leading-relaxed">{feature.desc}</p>
                  </Card>
                ))}
              </div>
            </Section>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
