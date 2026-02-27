import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Section } from "../components/Layout";
import { Button, Card, Badge, StepIndicator } from "../components/ui";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useArticleStore } from "../stores/articleStore";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { WRAPUP_ABI, CONTRACT_ADDRESSES } from "../wagmiConfig";
import { decodeEventLog } from "viem";
import axios from "axios";
import {
  Search, X, Link2, Zap, Save, ArrowRight, ArrowLeft,
  CheckCircle, Circle, Loader
} from "lucide-react";

const API_BASE = "/api";
const STEPS = ["Analyze", "Save to DB", "Upload IPFS", "Sign & Mint"];

export default function LegacyLandingPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scrapedPreview, setScrapedPreview] = useState(null);

  // Track each step explicitly
  const [stepIndex, setStepIndex] = useState(-1);
  const [savedArticle, setSavedArticle] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [txDone, setTxDone] = useState(false);

  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { markArticleOnChainDB, deleteArticleFromDB } = useArticleStore();

  const currentContractAddress = CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[421614];

  const { data: hash, isPending, writeContract, error: writeError } = useWriteContract();
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({ hash });

  // STEP 0: Scrape & Summarize
  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    setLoading(true);
    setError(null);
    setScrapedPreview(null);
    setSavedArticle(null);
    setIpfsHash(null);
    setTxDone(false);
    setStepIndex(-1);

    const tid = toast.loading("Scraping & summarizing article...");
    try {
      const res = await fetch(`${API_BASE}/articles/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scraping failed");
      setScrapedPreview(data.preview);
      toast.success("Article analyzed!", { id: tid });
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { id: tid });
    } finally {
      setLoading(false);
    }
  };

  // Full curation flow: DB → IPFS → Blockchain
  const handleCurate = async () => {
    if (!scrapedPreview) return;
    if (!isConnected) {
      toast.error("Connect wallet to curate");
      return;
    }

    setLoading(true);
    setError(null);
    setTxDone(false);

    try {
      // STEP 1: Save to Database
      setStepIndex(0);
      const tid1 = toast.loading("Step 1/3 — Saving to database...");
      let dbArticle;
      try {
        const res = await axios.post(`${API_BASE}/articles/prepare`, {
          title: scrapedPreview.title,
          summary: scrapedPreview.summary,
          detailedSummary: scrapedPreview.detailedSummary,
          condensedContent: scrapedPreview.condensedContent,
          keyPoints: scrapedPreview.keyPoints,
          statistics: scrapedPreview.statistics,
          imageUrl: scrapedPreview.imageUrl,
          articleUrl: scrapedPreview.articleUrl,
          cardJson: scrapedPreview.cardJson,
          author: scrapedPreview.author,
          publisher: scrapedPreview.publisher,
          date: scrapedPreview.date,
        });
        dbArticle = res.data.article;
        setSavedArticle(dbArticle);
        toast.success("Saved to database!", { id: tid1 });
      } catch (err) {
        if (err.response?.data?.article) {
          dbArticle = err.response.data.article;
          setSavedArticle(dbArticle);
          toast.success("Article already in database!", { id: tid1 });
        } else {
          throw new Error(err.response?.data?.error || "DB save failed");
        }
      }

      // STEP 2: Upload to IPFS
      setStepIndex(1);
      const tid2 = toast.loading("Step 2/3 — Uploading to IPFS...");
      const ipfsRes = await axios.post(`${API_BASE}/articles/upload-ipfs`, {
        ...scrapedPreview,
        id: dbArticle.id,
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
            },
          }
        );
      } else {
        doWrite();
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Curation failed");
      if (savedArticle?.id) {
        deleteArticleFromDB(savedArticle.id);
        setSavedArticle(null);
      }
      setStepIndex(-1);
      setLoading(false);
    }
  };

  // Handle tx confirmation
  useEffect(() => {
    if (isPending) {
      toast.loading("Waiting for wallet confirmation...", { id: "mintToast" });
    }

    if (isConfirming) {
      setStepIndex(2);
      toast.loading("Confirming on blockchain...", { id: "mintToast" });
    }

    if (isConfirmed && receipt && ipfsHash && savedArticle) {
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
        markArticleOnChainDB(savedArticle.articleUrl, onChainId, address, ipfsHash)
          .then(() => {
            setStepIndex(3);
            setTxDone(true);
            toast.success("Article curated on-chain!", { id: "mintToast" });
            setLoading(false);
            setTimeout(() => navigate("/curated"), 2000);
          })
          .catch((err) => {
            toast.error("DB sync failed: " + err.message, { id: "mintToast" });
            setLoading(false);
          });
      } else {
        setStepIndex(3);
        setTxDone(true);
        toast.success("Article minted!", { id: "mintToast" });
        setLoading(false);
        setTimeout(() => navigate("/curated"), 2000);
      }
    }

    if (isTxError || writeError) {
      toast.error("Transaction failed or rejected.", { id: "mintToast" });
      if (savedArticle?.id) {
        deleteArticleFromDB(savedArticle.id);
        setSavedArticle(null);
      }
      setStepIndex(-1);
      setLoading(false);
    }
  }, [isPending, isConfirming, isConfirmed, isTxError, receipt, writeError, txError, savedArticle, ipfsHash, address, navigate, markArticleOnChainDB, deleteArticleFromDB]);

  const handleReset = () => {
    setUrl("");
    setScrapedPreview(null);
    setError(null);
    setSavedArticle(null);
    setIpfsHash(null);
    setTxDone(false);
    setStepIndex(-1);
  };

  const isProcessing = loading || isPending || isConfirming;

  const getButtonLabel = () => {
    if (stepIndex === -1 && !loading) return "Curate & Mint";
    if (stepIndex === 0) return "Saving to DB...";
    if (stepIndex === 1) return "Uploading to IPFS...";
    if (stepIndex === 2 && (isPending || isConfirming)) return "Confirming on Chain...";
    if (txDone) return "Done!";
    return "Curate & Mint";
  };

  const steps = [
    { icon: Search, title: "Input", desc: "Paste any article URL." },
    { icon: Zap, title: "Process", desc: "AI extracts & summarizes insights." },
    { icon: Save, title: "Store", desc: "Saved to DB + IPFS." },
    { icon: Link2, title: "Mint", desc: "Verifiable record on-chain." },
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          
          <Section className="py-16">
            {/* Back Button */}
            <div className="text-center mb-8">
              <button
                onClick={() => navigate("/research")}
                className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to AI Research Engine
              </button>
            </div>

            {/* Hero */}
            <div className="text-center mb-12">
              <Badge color="orange" className="mb-6">
                Legacy Mode
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Curate any{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                  Article.
                </span>
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Paste a URL → AI summarizes → Saved to DB → Pinned to IPFS → Minted on-chain.
              </p>
            </div>

            {/* URL Input */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-2xl flex flex-col sm:flex-row gap-3 shadow-2xl shadow-black/50 focus-within:border-emerald-500/50 transition-all">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScrape(e)}
                  placeholder="Paste article URL here..."
                  className="flex-1 bg-transparent px-6 py-4 text-white placeholder-zinc-600 focus:outline-none text-lg w-full"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleScrape}
                  disabled={isProcessing || !url.trim()}
                  size="lg"
                  className="px-8 whitespace-nowrap"
                >
                  {loading && !scrapedPreview ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Analyze
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="max-w-xl mx-auto mb-8 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm">
                Error: {error}
              </div>
            )}

            {/* Preview + Curation Panel */}
            {scrapedPreview && (
              <Card variant="elevated" className="max-w-4xl mx-auto overflow-hidden animate-fade-in mb-16">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs text-zinc-400 uppercase">
                      Ready to Curate
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
                  {/* Step indicator */}
                  {stepIndex >= 0 && (
                    <StepIndicator steps={STEPS} currentStep={stepIndex} className="mb-8" />
                  )}

                  {/* Article preview */}
                  <div className="flex flex-col md:flex-row gap-8 mb-6">
                    {scrapedPreview.imageUrl && (
                      <div className="w-full md:w-1/3 aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
                        <img
                          src={scrapedPreview.imageUrl}
                          className="w-full h-full object-cover"
                          alt="Preview"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                        {scrapedPreview.title}
                      </h2>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
                        {scrapedPreview.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {scrapedPreview.keyPoints?.slice(0, 3).map((pt, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-700"
                          >
                            {pt.substring(0, 40)}
                            {pt.length > 40 ? "..." : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status rows */}
                  <div className="space-y-2 mb-6">
                    {[
                      {
                        label: "Database",
                        done: !!savedArticle,
                        active: stepIndex === 0,
                        value: savedArticle ? `ID: ${savedArticle.id?.slice(-8)}` : null,
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
                      variant={!isConnected ? "secondary" : "primary"}
                    >
                      {isProcessing && <Loader className="w-4 h-4 animate-spin" />}
                      {!isConnected ? "Connect Wallet" : getButtonLabel()}
                      {!isProcessing && !txDone && isConnected && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Feature steps — shown when no preview */}
            {!scrapedPreview && !loading && (
              <div className="pt-16 border-t border-zinc-800/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {steps.map((step, i) => (
                    <Card key={i} variant="interactive" className="p-8">
                      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-emerald-500/50 transition-all">
                        <step.icon className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-zinc-500 leading-relaxed">{step.desc}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
