"use client";

import { useState, useEffect } from "react";
import { EditorialPanel } from "@/components/ui/EditorialPanel";
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
    <div className="flex min-h-screen relative bg-paper selection:bg-highlight selection:text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 relative z-10 lg:ml-[260px] transition-[margin] duration-300">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-6 pb-6 pt-24 lg:px-8 lg:pt-28 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Admin Header */}
            <div>
              <h1 className="text-4xl font-serif font-black tracking-tighter text-ink mb-2 uppercase">
                Database Management
              </h1>
              <p className="text-sm font-mono uppercase tracking-widest text-ink-muted">
                Administer assets, mappings, and raw sentiment records.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-rule/20 pb-4">
              <button
                onClick={() => setActiveTab("assets")}
                className={`font-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors border-b-2 ${
                  activeTab === "assets"
                    ? "border-signal text-ink font-bold"
                    : "border-transparent text-ink-muted hover:text-ink hover:bg-highlight/20"
                }`}
              >
                Managed Assets
              </button>
              <button
                onClick={() => setActiveTab("mentions")}
                className={`font-mono text-xs uppercase tracking-widest px-4 py-2 transition-colors border-b-2 ${
                  activeTab === "mentions"
                    ? "border-signal text-ink font-bold"
                    : "border-transparent text-ink-muted hover:text-ink hover:bg-highlight/20"
                }`}
              >
                Raw Mentions
              </button>
            </div>

            {/* Content Area */}
            {activeTab === "assets" && (
              <EditorialPanel className="p-0">
                <div className="p-6 flex justify-between items-center border-b border-rule/10 bg-white">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                    <input
                      type="text"
                      placeholder="Search tickers..."
                      className="w-full bg-paper border border-rule/20 rounded-none py-2 px-9 font-mono text-sm text-ink focus:outline-none focus:border-ink transition-colors placeholder:text-ink-muted"
                    />
                  </div>
                  <button
                    onClick={handleAddAsset}
                    className="flex items-center gap-2 bg-ink hover:bg-signal text-paper px-6 py-2 text-xs font-mono uppercase tracking-widest font-bold transition-colors"
                  >
                    <Plus size={16} /> Add Ticker
                  </button>
                </div>

                {loading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-signal" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="font-mono text-[10px] uppercase tracking-widest text-ink-muted border-b border-rule/20 bg-paper">
                          <th className="px-6 py-4 font-bold">Ticker</th>
                          <th className="px-6 py-4 font-bold">
                            Company / Asset Name
                          </th>
                          <th className="px-6 py-4 font-bold">Type</th>
                          <th className="px-6 py-4 font-bold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-rule/10">
                        {assets.map((asset) => (
                          <tr
                            key={asset.asset_id}
                            className="hover:bg-highlight/10 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold text-ink data-font tracking-wide">
                              {asset.ticker}
                            </td>
                            <td className="px-6 py-4 text-ink-muted font-serif text-lg">
                              {asset.asset_name}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="neutral"
                              >
                                {asset.asset_type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={() => handleEditAsset(asset)}
                                  className="text-ink-muted hover:text-ink transition-colors"
                                  title="Edit Name"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteAsset(asset.asset_id)
                                  }
                                  className="text-ink-muted hover:text-signal transition-colors"
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
                              className="text-center py-8 font-mono text-sm text-ink-muted"
                            >
                              No assets found in database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </EditorialPanel>
            )}

            {activeTab === "mentions" && (
              <EditorialPanel className="p-0">
                <div className="p-6 flex justify-between items-center border-b border-rule/10 bg-white">
                  <h2 className="text-ink font-serif font-bold uppercase text-lg">
                    Recent Sentiment Records
                  </h2>
                  <span className="font-mono text-xs tracking-widest uppercase text-ink-muted">
                    Showing last 50 entries
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto w-full relative">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="sticky top-0 bg-paper z-10 box-border border-b border-rule/20">
                      <tr className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                        <th className="px-6 py-4 font-bold">
                          Date (UTC)
                        </th>
                        <th className="px-6 py-4 font-bold">
                          Ticker
                        </th>
                        <th className="px-6 py-4 font-bold text-right">
                          Sentiment
                        </th>
                        <th className="px-6 py-4 font-bold text-right">
                          Conf.
                        </th>
                        <th className="px-6 py-4 font-bold">
                          Source
                        </th>
                        <th className="px-6 py-4 font-bold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-rule/10 relative z-0">
                      {mentions.map((mention) => (
                        <tr
                          key={mention.mention_id}
                          className="hover:bg-highlight/10 transition-colors"
                        >
                          <td className="px-6 py-4 text-ink-muted whitespace-nowrap data-font">
                            {new Date(mention.created_at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-6 py-4 font-bold text-ink data-font whitespace-nowrap">
                            {mention.assets?.ticker || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge
                              variant={
                                mention.sentiment_score > 0.2
                                  ? "success"
                                  : mention.sentiment_score < -0.2
                                    ? "error"
                                    : "neutral"
                              }
                              className="whitespace-nowrap"
                            >
                              {mention.sentiment_score > 0 ? "+" : ""}
                              {mention.sentiment_score.toFixed(3)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-ink-muted data-font text-right">
                            {(mention.confidence_level * 100).toFixed(0)}%
                          </td>
                          <td className="px-6 py-4 text-ink-muted font-mono text-xs uppercase whitespace-nowrap">
                            {mention.platforms?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleDeleteMention(mention.mention_id)
                              }
                              className="inline-flex items-center justify-center text-ink-muted hover:text-signal transition-colors"
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
                            className="text-center py-8 font-mono text-sm text-ink-muted"
                          >
                            No mentions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </EditorialPanel>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
