"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Search, Edit2, Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface Asset {
  asset_id: string;
  ticker: string;
  asset_name: string;
  asset_type: string;
}

interface Mention {
  mention_id: string;
  asset_id: string;
  platform_id: string;
  sentiment_score: number;
  confidence_level: number;
  created_at: string;
  assets: { ticker: string };
  platforms: { name: string };
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"assets" | "mentions">("assets");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchMentions = async () => {
    try {
      const res = await fetch("/api/admin/mentions?page=1"); // Initial load page 1
      if (res.ok) {
        const data = await res.json();
        setMentions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auth Protection & Data Fetch
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }
      setAuthorized(true);
      fetchAssets();
    };

    checkAuthAndLoad();
  }, [router]);

  const handleDeleteAsset = async (assetId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this asset? This will cascade delete mentions.",
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: assetId }),
      });
      if (res.ok) {
        setAssets(assets.filter((a) => a.asset_id !== assetId));
        fetchMentions(); // Refresh mentions in case they were cascaded
      } else {
        alert("Failed to delete asset");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMention = async (mentionId: string) => {
    if (!confirm("Delete this sentiment record permanently?")) return;
    try {
      const res = await fetch("/api/admin/mentions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mention_id: mentionId }),
      });
      if (res.ok) {
        setMentions(mentions.filter((m) => m.mention_id !== mentionId));
      } else {
        alert("Failed to delete mention");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAsset = async (asset: Asset) => {
    const newName = prompt(
      `Enter new asset name for ${asset.ticker}`,
      asset.asset_name,
    );
    if (!newName || newName === asset.asset_name) return;

    try {
      const res = await fetch("/api/admin/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: asset.asset_id, asset_name: newName }),
      });
      if (res.ok) {
        setAssets(
          assets.map((a) =>
            a.asset_id === asset.asset_id ? { ...a, asset_name: newName } : a,
          ),
        );
      } else {
        alert("Failed to update asset name");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new ticker basic flow
  const handleAddAsset = async () => {
    const ticker = prompt("Enter Ticker Symbol (e.g. WMT):");
    if (!ticker) return;
    const name = prompt(
      `Enter Company Name for ${ticker} (e.g. Walmart Inc.):`,
    );
    if (!name) return;

    try {
      const res = await fetch("/api/admin/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          asset_name: name,
          asset_type: "stock",
        }), // Default to stock for now
      });
      if (res.ok) {
        const newAsset = await res.json();
        setAssets(
          [...assets, newAsset].sort((a, b) =>
            a.ticker.localeCompare(b.ticker),
          ),
        );
      } else {
        alert("Failed to add asset. Ticker might already exist.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!authorized) return null; // Prevent flash

  return (
    <div
      className="flex min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg-app)",
        color: "var(--text-secondary)",
      }}
    >
      {/* Background (Clean, dark for admin) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 relative z-10 lg:ml-[260px] transition-[margin] duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-6 pb-6 pt-24 lg:px-8 lg:pt-28 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Admin Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Database Management
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Administer assets, mappings, and raw sentiment records.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab("assets")}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                  activeTab === "assets"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                }`}
              >
                Managed Assets (Tickers)
              </button>
              {/* Mentions tab UI placeholder - can expand later if needed */}
              <button
                onClick={() => setActiveTab("mentions")}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                  activeTab === "mentions"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                }`}
              >
                Raw Mentions & Sentiment
              </button>
            </div>

            {/* Content Area */}
            {activeTab === "assets" && (
              <GlassPanel className="p-0 overflow-hidden border border-white/10 rounded-xl">
                <div className="bg-[var(--bg-card)] p-4 flex justify-between items-center border-b border-white/5">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search tickers..."
                      className="w-full bg-black/20 border border-white/10 rounded-md py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleAddAsset}
                    className="flex items-center gap-2 bg-[var(--brand-primary)] hover:bg-[#5a52d6] text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  >
                    <Plus size={16} /> Add Ticker
                  </button>
                </div>

                {loading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-primary)]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-white/5 bg-black/10">
                          <th className="px-6 py-3 font-medium">Ticker</th>
                          <th className="px-6 py-3 font-medium">
                            Company / Asset Name
                          </th>
                          <th className="px-6 py-3 font-medium">Type</th>
                          <th className="px-6 py-3 font-medium text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-white/5">
                        {assets.map((asset) => (
                          <tr
                            key={asset.asset_id}
                            className="hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-3 font-bold text-white tracking-wide">
                              {asset.ticker}
                            </td>
                            <td className="px-6 py-3 text-[var(--text-secondary)]">
                              {asset.asset_name}
                            </td>
                            <td className="px-6 py-3">
                              <Badge
                                variant="neutral"
                                className="capitalize text-xs px-2 py-0.5"
                              >
                                {asset.asset_type}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditAsset(asset)}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-white/10 rounded transition-colors"
                                  title="Edit Name"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteAsset(asset.asset_id)
                                  }
                                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors"
                                  title="Delete Asset"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {assets.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-8 text-[var(--text-muted)]"
                            >
                              No assets found in database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassPanel>
            )}

            {activeTab === "mentions" && (
              <GlassPanel className="p-0 overflow-hidden border border-white/10 rounded-xl">
                <div className="bg-[var(--bg-card)] p-4 flex justify-between items-center border-b border-white/5">
                  <h2 className="text-white font-medium">
                    Recent Sentiment Records
                  </h2>
                  <span className="text-xs text-[var(--text-muted)]">
                    Showing last 50 entries
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full relative">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
                      <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)] border-b border-white/5">
                        <th className="px-6 py-3 font-medium bg-[#0f1115]">
                          Date (UTC)
                        </th>
                        <th className="px-6 py-3 font-medium bg-[#0f1115]">
                          Ticker
                        </th>
                        <th className="px-6 py-3 font-medium text-right bg-[#0f1115]">
                          Sentiment
                        </th>
                        <th className="px-6 py-3 font-medium text-right bg-[#0f1115]">
                          Conf.
                        </th>
                        <th className="px-6 py-3 font-medium bg-[#0f1115]">
                          Source
                        </th>
                        <th className="px-6 py-3 font-medium text-right bg-[#0f1115]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-white/5 relative z-0 bg-[#0f1115]/30">
                      {mentions.map((mention) => (
                        <tr
                          key={mention.mention_id}
                          className="hover:bg-white/[0.04] transition-colors"
                        >
                          <td className="px-6 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                            {new Date(mention.created_at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-6 py-3 font-bold text-white whitespace-nowrap">
                            {mention.assets?.ticker || "Unknown"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Badge
                              variant={
                                mention.sentiment_score > 0.2
                                  ? "success"
                                  : mention.sentiment_score < -0.2
                                    ? "error"
                                    : "neutral"
                              }
                              className="px-2 py-0.5 whitespace-nowrap"
                            >
                              {mention.sentiment_score > 0 ? "+" : ""}
                              {mention.sentiment_score.toFixed(3)}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-[var(--text-secondary)] tabular-nums text-right">
                            {(mention.confidence_level * 100).toFixed(0)}%
                          </td>
                          <td className="px-6 py-3 text-[var(--text-muted)] capitalize whitespace-nowrap">
                            {mention.platforms?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleDeleteMention(mention.mention_id)
                              }
                              className="p-1.5 inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {mentions.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-[var(--text-muted)]"
                          >
                            No mentions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassPanel>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
