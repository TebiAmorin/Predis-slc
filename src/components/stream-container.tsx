"use client";

import { useState, useEffect } from "react";

type StreamChannel = {
  name: string;
  twitch: string;
  x: string;
  tiktok: string;
  youtube: string;
  label: string;
};

const CHANNELS: StreamChannel[] = [
  {
    name: "VETEL",
    twitch: "vetelcito01",
    x: "Vetel_GG",
    tiktok: "https://www.tiktok.com/@vetel_gg",
    youtube: "https://www.youtube.com/@VETEL_GG",
    label: "Stream de Vetel",
  },
  {
    name: "TEBI",
    twitch: "tebi10",
    x: "TebiiR6",
    tiktok: "https://www.tiktok.com/@tebiir6",
    youtube: "https://www.youtube.com/@TebiiR6",
    label: "Stream de Tebi",
  },
];

export function StreamContainer() {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [hostname, setHostname] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Channel Selector */}
      <div className="flex bg-bg-alt/50 backdrop-blur-md slc-cyber-clip border border-border p-1.5 shadow-2xl">
        {CHANNELS.map((channel) => (
          <button
            key={channel.twitch}
            onClick={() => setActiveChannel(channel)}
            className={`flex-1 py-4 font-heading font-black tracking-[0.2em] text-sm uppercase transition-all duration-500 relative overflow-hidden group ${
              activeChannel.twitch === channel.twitch
                ? "text-white"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {activeChannel.twitch === channel.twitch && (
              <div className="absolute inset-0 bg-gradient-to-r from-r6-red/80 to-r6-red shadow-[0_0_20px_rgba(255,0,60,0.4)]" />
            )}
            <span className="relative z-10">{channel.name}</span>
            {activeChannel.twitch !== channel.twitch && (
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-accent/30 group-hover:w-full transition-all duration-300" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Stream Player */}
        <div className="twitch-embed slc-cyber-clip border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black aspect-video relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />
          <iframe
            src={`https://player.twitch.tv/?channel=${activeChannel.twitch}&parent=${hostname || 'localhost'}&muted=true`}
            allowFullScreen
            className="absolute inset-0 w-full h-full z-10"
          />
        </div>

        {/* Channel Info & Socials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Channel Bar 1: Vetel */}
          <div className={`group/bar flex flex-col relative`}>
            <button 
              onClick={() => setActiveChannel(CHANNELS[0])}
              className={`bg-card/40 backdrop-blur-xl slc-cyber-clip border-l-4 p-5 flex items-center justify-between transition-all duration-700 shadow-xl w-full text-left ${activeChannel.twitch === 'vetelcito01' ? 'border-r6-red bg-r6-red/5 translate-x-1' : 'border-border/50 opacity-40 hover:opacity-100 hover:bg-white/5'}`}
            >
              <div className="min-w-0">
                <p className="font-heading font-black tracking-widest text-lg text-text uppercase italic">VETEL</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full bg-r6-red ${activeChannel.twitch === 'vetelcito01' ? 'animate-pulse' : 'opacity-50'}`} />
                  <p className="text-xs text-text-secondary truncate font-bold uppercase tracking-tighter">Live Support</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 relative z-20">
                <a href="https://twitch.tv/vetelcito01" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-[#9146FF] p-2 slc-cyber-clip text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(145,70,255,0.5)] transition-all"><TwitchIcon /></a>
                <a href="https://x.com/Vetel_GG" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/10 p-2 slc-cyber-clip text-text hover:scale-110 hover:bg-white/20 transition-all"><XIcon /></a>
                <a href={CHANNELS[0].tiktok} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/10 p-2 slc-cyber-clip text-text hover:scale-110 hover:bg-white/20 transition-all"><TikTokIcon /></a>
                <a href={CHANNELS[0].youtube} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/10 p-2 slc-cyber-clip text-text hover:scale-110 hover:bg-white/20 transition-all"><YoutubeIcon /></a>
              </div>
            </button>
            {activeChannel.twitch === 'vetelcito01' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-r6-red rounded-full blur-sm" />
            )}
          </div>

          {/* Channel Bar 2: Tebi */}
          <div className={`group/bar flex flex-col relative`}>
            <button 
              onClick={() => setActiveChannel(CHANNELS[1])}
              className={`bg-card/40 backdrop-blur-xl slc-cyber-clip border-l-4 p-5 flex items-center justify-between transition-all duration-700 shadow-xl w-full text-left ${activeChannel.twitch === 'tebi10' ? 'border-accent bg-accent/5 translate-x-1' : 'border-border/50 opacity-40 hover:opacity-100 hover:bg-white/5'}`}
            >
              <div className="min-w-0">
                <p className="font-heading font-black tracking-widest text-lg text-text uppercase italic">TEBI</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full bg-accent ${activeChannel.twitch === 'tebi10' ? 'animate-pulse' : 'opacity-50'}`} />
                  <p className="text-xs text-text-secondary truncate font-bold uppercase tracking-tighter">Analyst Desk</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 relative z-20">
                <a href="https://twitch.tv/tebi10" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-[#9146FF] p-2 slc-cyber-clip text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(145,70,255,0.5)] transition-all"><TwitchIcon /></a>
                <a href="https://x.com/TebiiR6" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/10 p-2 slc-cyber-clip text-text hover:scale-110 hover:bg-white/20 transition-all"><XIcon /></a>
                <a href={CHANNELS[1].tiktok} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/10 p-2 slc-cyber-clip text-text hover:scale-110 hover:bg-white/20 transition-all"><TikTokIcon /></a>
                <a href={CHANNELS[1].youtube} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="bg-white/10 p-2 slc-cyber-clip text-text hover:scale-110 hover:bg-white/20 transition-all"><YoutubeIcon /></a>
              </div>
            </button>
            {activeChannel.twitch === 'tebi10' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent rounded-full blur-sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.33-.85.51-1.44 1.43-1.58 2.41-.14.99.13 2.02.74 2.81.59.75 1.55 1.21 2.52 1.21 1.23.01 2.4-.65 3.01-1.72.35-.57.51-1.25.48-1.91V.02h.01z"/></svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
}
