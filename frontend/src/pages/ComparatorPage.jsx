import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Section } from "../components/Layout";
import { Button, Card, Badge, StepIndicator } from "../components/ui";
import axios from "axios";
import toast from "react-hot-toast";
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
  Scale, Link2, Loader, Trophy, Shield, Zap, Globe,
  Star, AlertCircle, CheckCircle, XCircle, TrendingUp, BookOpen,
  ArrowRight, Hexagon, BarChart3, Circle,
} from "lucide-react";
import { useArticleStore } from "../stores/articleStore";

const API_BASE = "/api";

const DIMENSION_META = {
  credibility:    { label: "Credibility",     icon: Shield,      color: "#10b981" },
  depth:          { label: "Depth",           icon: BookOpen,    color: "#3b82f6" },
  bias:           { label: "Bias Level",      icon: Scale,       color: "#f59e0b" },
  truthiness:     { label: "Truthiness",      icon: CheckCircle, color: "#10b981" },
  impact:         { label: "Impact",          icon: TrendingUp,  color: "#8b5cf6" },
  writingQuality: { label: "Writing Quality", icon: Star,        color: "#f59e0b" },
  publicPresence: { label: "Public Presence", icon: Globe,       color: "#3b82f6" },
  originality:    { label: "Originality",     icon: Zap,         color: "#8b5cf6" },
};

function ScoreBar({ score, color, size = "md" }) {
  const h = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={`w-full bg-zinc-800 rounded-full overflow-hidden ${h}`}>
      <div
        className={`${h} rounded-full transition-all duration-700`}
        style={{ width: `${score * 10}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ArticleCard({ meta, label, accent }) {
  if (!meta) return null;
  return (
    <Card variant="outline" className="p-5 flex-1" style={{ borderColor: accent + "40" }}>
      <div 
        className="text-xs font-bold uppercase tracking-wider mb-3 px-2.5 py-1 rounded-lg inline-block"
        style={{ backgroundColor: accent + "15", color: accent }}
      >
        {label}
      </div>
      {meta.image && (
        <img 
          src={meta.image} 
          alt={meta.title} 
          className="w-full h-32 object-cover rounded-xl mb-3 opacity-80"
          onError={(e) => (e.target.style.display = "none")} 
        />
      )}
      <h3 className="font-bold text-white text-base leading-snug mb-2 line-clamp-2">{meta.title}</h3>
      <div className="text-xs text-zinc-500 space-y-1">
        {meta.publisher && <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> {meta.publisher}</div>}
        {meta.author && <div className="flex items-center gap-1.5"><Star className="w-3 h-3" /> {meta.author}</div>}
        {meta.date && <div className="flex items-center gap-1.5"><Hexagon className="w-3 h-3" /> {new Date(meta.date).toLocaleDateString()}</div>}
      </div>
      {meta.description && (
        <p className="text-zinc-400 text-xs mt-3 line-clamp-3 leading-relaxed">{meta.description}</p>
      )}
    </Card>
  );
}

const PUBLISH_STEPS = ["Save to DB", "Upload IPFS", "Sign Tx", "Confirmed"];

export default function ComparatorPage() {
  const [urlOne, setUrlOne] = useState("");
  const [urlTwo, setUrlTwo] = useState("");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);

  // Publish flow state
  const [publishStep, setPublishStep] = useState(-1);
  const [publishIpfsHash, setPublishIpfsHash] = useState(null);
  const [savedComparison, setSavedComparison] = useState(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { deleteComparisonFromDB } = useArticleStore();

  const currentContractAddress = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[421614];

  const {
    data: publishHash,
    isPending: isPublishing,
    writeContract: writePublish,
    error: publishWriteError,
    isError: isPublishWriteError,
  } = useWriteContract();

  const {
    isLoading: isPublishConfirming,
    isSuccess: isPublishConfirmed,
    isError: isPublishTxError,
    error: publishTxError,
    data: publishReceipt,
  } = useWaitForTransactionReceipt({ hash: publishHash });

  // Generate comparison
  const handleCompare = async (e) => {
    e.preventDefault();
    if (!urlOne.trim() || !urlTwo.trim()) { toast.error("Please enter both article URLs"); return; }
    try { new URL(urlOne); new URL(urlTwo); } catch { toast.error("Invalid URL format"); return; }
    if (urlOne === urlTwo) { toast.error("Please enter two different URLs"); return; }

    setLoading(true);
    setComparison(null);
    setSavedComparison(null);
    setPublishStep(-1);
    setPublishIpfsHash(null);

    const tid = toast.loading("Scraping & analyzing articles...");
    try {
      const res = await axios.post(`${API_BASE}/comparisons/generate`, {
        urlOne: urlOne.trim(),
        urlTwo: urlTwo.trim(),
      });
      
      setComparison(res.data.comparison);
      toast.success(res.data.cached ? "Loaded cached comparison!" : "Analysis complete! Ready to curate.", { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.error || "Comparison failed", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  // Curate Flow (DB -> IPFS -> Mint)
  const handleCurate = async () => {
    if (!isConnected) { toast.error("Connect wallet to publish"); return; }
    if (!comparison) return;

    setPublishStep(0);
    const tid = toast.loading("Publishing comparison on-chain...");

    try {
      // Step 0: Save to DB
      const res = await axios.post(`${API_BASE}/comparisons/generate`, { action: 'prepare', comparisonData: comparison });
      const dbComp = res.data.comparison;
      setSavedComparison(dbComp);
      setPublishStep(1);

      // Step 1: Upload to IPFS
      toast.loading("Uploading to IPFS...", { id: tid });
      const ipfsRes = await axios.post(`${API_BASE}/comparisons/upload-ipfs`, { comparisonId: dbComp.id });
      const { ipfsHash } = ipfsRes.data;
      if (!ipfsHash) throw new Error("IPFS upload failed");
      setPublishIpfsHash(ipfsHash);
      setPublishStep(2);

      // Step 2: Submit to blockchain
      toast.loading("Sign transaction in wallet...", { id: tid });

      const doWrite = () => {
        writePublish({
          address: currentContractAddress,
          abi: WRAPUP_ABI,
          functionName: "submitArticle",
          args: [ipfsHash],
        });
      };

      if (!CONTRACT_ADDRESSES[chainId]) {
        switchChain(
          { chainId: 421614 },
          {
            onSuccess: doWrite,
            onError: () => {
              toast.error("Network switch failed", { id: tid });
              setPublishStep(-1);
            },
          }
        );
      } else {
        doWrite();
      }
    } catch (err) {
      toast.error(err.message || "Publish failed", { id: tid });
      if (savedComparison?.id) {
        deleteComparisonFromDB(savedComparison.id);
        setSavedComparison(null);
      }
      setPublishStep(-1);
    }
  };

  // Handle publish tx result
  useEffect(() => {
    if (isPublishing) toast.loading("Waiting for wallet...", { id: "compPubToast" });
    if (isPublishConfirming) { setPublishStep(2); toast.loading("Confirming on blockchain...", { id: "compPubToast" }); }

    if (isPublishConfirmed && publishReceipt && savedComparison && publishIpfsHash) {
      setPublishStep(3);
      let blockchainId = null;
      try {
        for (const log of publishReceipt.logs) {
          const event = decodeEventLog({ abi: WRAPUP_ABI, data: log.data, topics: log.topics });
          if (event.eventName === "ArticleSubmitted") { blockchainId = event.args.articleId.toString(); break; }
        }
      } catch {}

      if (blockchainId && address) {
        toast.loading("Finalizing...", { id: "compPubToast" });
        axios.post(`${API_BASE}/comparisons/mark-onchain`, {
          comparisonId: savedComparison.id,
          blockchainId,
          curator: address,
          ipfsHash: publishIpfsHash,
        }).then(() => {
          toast.success("Comparison published on-chain!", { id: "compPubToast" });
          setComparison((prev) => ({ ...prev, onChain: true, blockchainId: parseInt(blockchainId), ipfsHash: publishIpfsHash }));
          setPublishStep(-1);
        }).catch((err) => {
          toast.error("DB sync failed: " + err.message, { id: "compPubToast" });
          setPublishStep(-1);
        });
      } else {
        toast.success("Published on-chain!", { id: "compPubToast" });
        setComparison((prev) => ({ ...prev, onChain: true, ipfsHash: publishIpfsHash }));
        setPublishStep(-1);
      }
    }

    if (isPublishTxError || isPublishWriteError) {
      toast.error(publishTxError?.shortMessage || publishWriteError?.shortMessage || "Transaction failed", { id: "compPubToast" });
      if (savedComparison?.id) {
        deleteComparisonFromDB(savedComparison.id);
        setSavedComparison(null);
      }
      setPublishStep(-1);
    }
  }, [isPublishing, isPublishConfirming, isPublishConfirmed, isPublishTxError, isPublishWriteError, publishReceipt, savedComparison, publishIpfsHash, address, deleteComparisonFromDB]);

  const report = comparison?.report;
  const dims = report?.dimensions ? Object.entries(report.dimensions) : [];

  const wins = { article1: 0, article2: 0 };
  dims.forEach(([, d]) => {
    if (d.winner === "article1") wins.article1++;
    else if (d.winner === "article2") wins.article2++;
  });

  const isPublishInProgress = publishStep >= 0;
  const isFullyRevealed = comparison?.onChain || publishStep === 3;

  const features = [
    { icon: Link2, title: "Paste URLs", desc: "Drop any two article links — news, blogs, research papers." },
    { icon: Scale, title: "AI Analysis", desc: "AI scrapes and scores across 8 critical dimensions. Preview results instantly." },
    { icon: Hexagon, title: "Mint Report", desc: "Store comparison permanently on-chain via IPFS to unlock full data." },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' fill='none'/%3E%3C/svg%3E")` }} 
      />

      <Navbar />

      <main className="flex-grow relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <Section className="py-16">
            {/* Hero */}
            <div className="text-center mb-12">
              <Badge className="mb-6">
                <Scale className="w-3.5 h-3.5" />
                AI Article Comparator
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Compare Any Two{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                  Articles.
                </span>
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Paste two URLs. AI scrapes and evaluates across 8 dimensions. Mint securely to view the full deep-dive.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCompare} className="mb-12">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {[
                  { val: urlOne, set: setUrlOne, label: "Article 1", accent: "#10b981", placeholder: "https://techcrunch.com/..." },
                  { val: urlTwo, set: setUrlTwo, label: "Article 2", accent: "#3b82f6", placeholder: "https://theverge.com/..." },
                ].map(({ val, set, label, accent, placeholder }) => (
                  <div key={label} className="relative">
                    <div 
                      className="absolute top-0 left-0 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-tl-xl rounded-br-xl z-10" 
                      style={{ backgroundColor: accent + "15", color: accent }}
                    >
                      {label}
                    </div>
                    <div 
                      className="bg-zinc-900 border rounded-xl pt-10 pb-4 px-4 focus-within:border-opacity-80 transition-all" 
                      style={{ borderColor: accent + "30" }}
                    >
                      <input 
                        type="url" 
                        value={val} 
                        onChange={(e) => set(e.target.value)} 
                        placeholder={placeholder} 
                        className="w-full bg-transparent text-white placeholder-zinc-600 focus:outline-none text-sm" 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={loading || !urlOne.trim() || !urlTwo.trim()}
                  size="lg"
                  className="px-10"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" /> 
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Scale className="w-5 h-5" /> 
                      Compare Articles 
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Comparison Results */}
            {comparison && report && (
              <div className="space-y-8 animate-fade-in">
                {/* Article Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ArticleCard meta={comparison.articleOneMeta} label="Article 1" accent="#10b981" />
                  <ArticleCard meta={comparison.articleTwoMeta} label="Article 2" accent="#3b82f6" />
                </div>

                {/* Overall Scores */}
                <Card variant="elevated" className="p-6">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-emerald-400" /> Overall Scores (Preview)
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { label: "Article 1", pct: report.overallScores?.article1Percentage || 0, total: report.overallScores?.article1Total || 0, accent: "#10b981", wins: wins.article1, isWinner: report.verdict?.winner === "article1" },
                      { label: "Article 2", pct: report.overallScores?.article2Percentage || 0, total: report.overallScores?.article2Total || 0, accent: "#3b82f6", wins: wins.article2, isWinner: report.verdict?.winner === "article2" },
                    ].map((item) => (
                      <div 
                        key={item.label} 
                        className={`relative p-5 rounded-xl border bg-zinc-900 ${item.isWinner ? "border-opacity-60" : "border-zinc-800"}`} 
                        style={{ borderColor: item.isWinner ? item.accent : undefined }}
                      >
                        {item.isWinner && (
                          <div 
                            className="absolute -top-3 left-4 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-widest" 
                            style={{ backgroundColor: item.accent, color: "#000" }}
                          >
                            Winner
                          </div>
                        )}
                        <div className="flex items-end justify-between mb-3">
                          <span className="font-bold text-white">{item.label}</span>
                          <span className="text-3xl font-bold" style={{ color: item.accent }}>{item.pct}%</span>
                        </div>
                        <ScoreBar score={item.pct / 10} color={item.accent} />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Action Panel for Preview mode */}
                {!isFullyRevealed && (
                  <Card variant="success" className="p-6 text-center">
                    <h3 className="font-bold text-xl text-white mb-2">Analysis Complete</h3>
                    <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
                      We've successfully scored these articles. Click "Curate & Mint" to permanently log these findings on the blockchain and unlock the comprehensive deep-dive report.
                    </p>
                    
                    {isPublishInProgress && (
                      <div className="flex justify-center mb-6">
                        <StepIndicator steps={PUBLISH_STEPS} currentStep={publishStep} />
                      </div>
                    )}

                    <Button
                      onClick={handleCurate}
                      disabled={!isConnected || isPublishInProgress || isPublishing || isPublishConfirming}
                      size="lg"
                    >
                      {isPublishInProgress || isPublishing || isPublishConfirming ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" /> Minting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-5 h-5" /> Curate & Mint
                        </>
                      )}
                    </Button>
                    {!isConnected && <p className="text-xs text-zinc-500 mt-3">Connect wallet to unlock details</p>}
                  </Card>
                )}

                {/* Full Details - Only shown if curated */}
                {isFullyRevealed && (
                  <div className="space-y-8 animate-fade-in">
                    {/* Verdict */}
                    <Card className="p-6">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Verdict</div>
                      <p className="text-white font-medium mb-2">{report.verdict.shortVerdict}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{report.verdict.fullVerdict}</p>
                      {report.verdict.recommendation && (
                        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400 flex items-start gap-2">
                          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          {report.verdict.recommendation}
                        </div>
                      )}
                    </Card>

                    {/* Dimension Breakdown */}
                    <Card variant="elevated" className="p-6">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-400" /> Dimension Breakdown
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        {dims.map(([key, dim]) => {
                          const meta = DIMENSION_META[key] || { label: key, color: "#6b7280" };
                          const Icon = meta.icon || Star;
                          return (
                            <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                  <span className="font-bold text-white text-sm">{meta.label}</span>
                                </div>
                                {dim.winner && (
                                  <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase" 
                                    style={{ backgroundColor: (dim.winner === "article1" ? "#10b981" : "#3b82f6") + "15", color: dim.winner === "article1" ? "#10b981" : "#3b82f6" }}
                                  >
                                    {dim.winner === "article1" ? "A1 Wins" : "A2 Wins"}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-3">
                                {[
                                  { label: "Article 1", score: dim.article1Score, analysis: dim.article1Analysis, accent: "#10b981" }, 
                                  { label: "Article 2", score: dim.article2Score, analysis: dim.article2Analysis, accent: "#3b82f6" }
                                ].map((item) => (
                                  <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-zinc-500">{item.label}</span>
                                      <span className="text-xs font-mono font-bold" style={{ color: item.accent }}>{item.score}/10</span>
                                    </div>
                                    <ScoreBar score={item.score} color={item.accent} size="sm" />
                                    {item.analysis && <p className="text-zinc-500 text-xs mt-1 leading-relaxed line-clamp-2">{item.analysis}</p>}
                                  </div>
                                ))}
                              </div>
                              {dim.explanation && <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">{dim.explanation}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Agreements & Disagreements */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {report.agreements?.length > 0 && (
                        <Card variant="success" className="p-6">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" /> Agreements
                          </h3>
                          <ul className="space-y-2">
                            {report.agreements.map((a, i) => (
                              <li key={i} className="text-zinc-300 text-sm flex gap-2">
                                <span className="text-emerald-400 flex-shrink-0">✓</span>{a}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      )}
                      {report.disagreements?.length > 0 && (
                        <Card className="p-6 border-orange-500/30">
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-orange-500" /> Disagreements
                          </h3>
                          <div className="space-y-4">
                            {report.disagreements.map((d, i) => (
                              <div key={i} className="border-l-2 border-orange-500/40 pl-3">
                                <div className="font-medium text-white text-sm mb-1">{d.topic}</div>
                                <div className="text-xs text-zinc-400 space-y-0.5">
                                  <div><span className="text-emerald-400">A1:</span> {d.article1Position}</div>
                                  <div><span className="text-blue-400">A2:</span> {d.article2Position}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>

                    {/* Key Differences */}
                    {report.keyDifferences?.length > 0 && (
                      <Card variant="elevated" className="p-6">
                        <h3 className="font-bold text-lg mb-4">Key Differences</h3>
                        <ul className="grid md:grid-cols-2 gap-3">
                          {report.keyDifferences.map((d, i) => (
                            <li key={i} className="flex gap-3 text-sm text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                              <span className="text-emerald-400 font-mono font-bold flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                    {/* Fact-Check Notes */}
                    {report.factCheckNotes?.length > 0 && (
                      <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-yellow-400">
                          <AlertCircle className="w-5 h-5" /> Fact-Check Notes
                        </h3>
                        <ul className="space-y-2">
                          {report.factCheckNotes.map((n, i) => (
                            <li key={i} className="text-zinc-300 text-sm flex gap-2">
                              <span className="text-yellow-400 flex-shrink-0">⚠</span> {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* On-Chain Status */}
                    <Card variant="success" className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-emerald-400 mb-1 flex items-center gap-2">
                            <Hexagon className="w-4 h-4" /> Published On-Chain
                          </h3>
                          <p className="text-zinc-500 text-sm">
                            On-chain ID: #{comparison.blockchainId} | IPFS: {comparison.ipfsHash?.substring(0, 20)}...
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 px-4 py-2 rounded-xl font-bold text-emerald-400 text-sm">
                          ✓ Curated
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Feature Cards - Show when no comparison */}
            {!comparison && !loading && (
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {features.map((step, i) => (
                  <Card key={i} variant="interactive" className="p-6">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all">
                      <step.icon className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
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
