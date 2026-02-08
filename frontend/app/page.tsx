"use client";

import React, { useState, useEffect, useRef, ReactElement } from 'react';
import {
	Coffee, Shield, Zap, ArrowRight, Heart,
	Terminal, Anchor, Code, Video, Mic, MicOff,
	VideoOff, Users, MonitorUp, Star, Clock,
	Globe, Sparkles, ChevronDown, Command, Ghost
} from 'lucide-react';
import Link from 'next/link';

interface FeatureItem {
	icon: ReactElement;
	title: string;
	desc: string;
	color: string;
	bg: string;
}

interface TechItem {
	name: string;
	icon: ReactElement;
}

/**
 * HOOKS
 */
const useScrollPosition = (): number => {
	const [scrollPos, setScrollPos] = useState<number>(0);
	useEffect(() => {
		const update = () => setScrollPos(window.scrollY);
		window.addEventListener('scroll', update);
		return () => window.removeEventListener('scroll', update);
	}, []);
	return scrollPos;
};

const useInView = (threshold = 0.15) => {
	const ref = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([entry]) => { if (entry.isIntersecting) setInView(true); },
			{ threshold }
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, [threshold]);
	return { ref, inView };
};

/**
 * VIDEO CALL SIM
 */
const VideoCallSimulation: React.FC = () => {
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoOff, setIsVideoOff] = useState(false);
	const participants = [
		{ id: 1, name: 'You', initials: 'YO', color: 'bg-blue-400' },
		{ id: 2, name: 'Peer', initials: 'DV', color: 'bg-red-400' }
	];

	return (
		<div className="flex flex-col h-full gap-3 font-[Outfit]">
			<div className="grid grid-cols-2 gap-3 flex-1">
				{participants.map((p) => (
					<div key={p.id} className="relative bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center overflow-hidden min-h-[120px]">
						<div className={`w-14 h-14 rounded-full ${p.color} flex items-center justify-center text-white text-lg font-bold border-2 border-white/80 shadow-lg`}>
							{p.initials}
						</div>
						<div className="absolute bottom-2.5 left-2.5 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] text-white/90 font-medium flex items-center gap-1.5">
							<div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
							{p.name}
						</div>
					</div>
				))}
			</div>
			<div className="flex items-center justify-center gap-2.5 bg-white/50 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/30">
				<button onClick={() => setIsMuted(!isMuted)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
					{isMuted ? <MicOff size={16} /> : <Mic size={16} />}
				</button>
				<button onClick={() => setIsVideoOff(!isVideoOff)} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`}>
					{isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
				</button>
				<button className="w-9 h-9 rounded-full bg-white/80 text-slate-600 hover:bg-white flex items-center justify-center transition-all">
					<MonitorUp size={16} />
				</button>
				<button className="w-9 h-9 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-all">
					<span className="text-[10px] font-bold">End</span>
				</button>
			</div>
		</div>
	);
};

/**
 * TYPING TEXT
 */
const TypingText: React.FC<{ texts: string[] }> = ({ texts }) => {
	const [idx, setIdx] = useState(0);
	const [charIdx, setCharIdx] = useState(0);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		const current = texts[idx];
		const speed = deleting ? 30 : 60;
		if (!deleting && charIdx === current.length) {
			setTimeout(() => setDeleting(true), 2200);
			return;
		}
		if (deleting && charIdx === 0) {
			setDeleting(false);
			setIdx(prev => (prev + 1) % texts.length);
			return;
		}
		const timer = setTimeout(() => {
			setCharIdx(prev => prev + (deleting ? -1 : 1));
		}, speed);
		return () => clearTimeout(timer);
	}, [charIdx, deleting, idx, texts]);

	return (
		<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500">
			{texts[idx].slice(0, charIdx)}
			<span className="animate-blink text-red-400">|</span>
		</span>
	);
};

/**
 * MARQUEE
 */
const MarqueeStrip: React.FC = () => {
	const items = [
		"1:1 COFFEE CHATS", "•", "WEBRTC", "•", "15 MIN SESSIONS", "•",
		"TALK ABOUT WHAT YOU'RE BUILDING", "•", "PEER CONVERSATIONS", "•",
		"NO SMALL TALK", "•", "REAL DEVS ONLY", "•"
	];
	const doubled = [...items, ...items];
	return (
		<div className="overflow-hidden py-5 bg-slate-900 relative">
			<div className="marquee-track flex gap-8 whitespace-nowrap">
				{doubled.map((item, i) => (
					<span key={i} className={`text-sm font-bold tracking-[0.3em] uppercase ${item === '•' ? 'text-red-400' : 'text-white/60'}`}>
						{item}
					</span>
				))}
			</div>
		</div>
	);
};

/**
 * MAIN PAGE
 */
export default function EtherealCodeBreakLanding() {
	const scrollY = useScrollPosition();
	const processView = useInView(0.1);
	const testimonialsView = useInView(0.1);
	const stackView = useInView(0.1);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const link = document.createElement('link');
		link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap';
		link.rel = 'stylesheet';
		document.head.appendChild(link);
		return () => { document.head.removeChild(link); };
	}, []);

	useEffect(() => {
		const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
		window.addEventListener('mousemove', handleMouse);
		return () => window.removeEventListener('mousemove', handleMouse);
	}, []);

	const features: FeatureItem[] = [
		{
			icon: <Coffee size={24} />,
			title: "Pick a Topic",
			desc: "What are you working on? Kubernetes? A new React pattern? Pick your interest and get matched with someone who cares about the same thing.",
			color: "text-amber-500",
			bg: "bg-amber-500/10"
		},
		{
			icon: <Users size={24} />,
			title: "Get Matched 1:1",
			desc: "Instantly paired with another developer who shares your interest. Video call starts. It's like a coffee break, but with someone who gets it.",
			color: "text-blue-500",
			bg: "bg-blue-500/10"
		},
		{
			icon: <Zap size={24} />,
			title: "Talk & Go",
			desc: "15 minutes. Share what you're building, swap ideas, help each other out. When time's up, you disconnect. No lingering, no obligations.",
			color: "text-red-500",
			bg: "bg-red-500/10"
		}
	];

	const techStack: TechItem[] = [
		{ name: 'React', icon: <Code /> },
		{ name: 'WebRTC', icon: <Zap /> },
		{ name: 'Node.js', icon: <Command /> },
		{ name: 'Socket.IO', icon: <Terminal /> },
	];

	const testimonials = [
		{ name: "Alex R.", role: "Staff Engineer @ Stripe", text: "Had a 15-min chat about event sourcing with a stranger. Left with a completely new approach to our system. This is what conferences should feel like.", avatar: "AR", color: "bg-red-400" },
		{ name: "Priya S.", role: "Senior Dev @ Vercel", text: "I talk about edge functions with someone new every morning over coffee. It's the best part of my day.", avatar: "PS", color: "bg-blue-400" },
	];

	return (
		<div className="min-h-screen bg-[#f3f6fc] text-[#475569] font-[Outfit] relative overflow-hidden selection:bg-purple-200 selection:text-purple-900">

			{/* Cursor glow */}
			<div
				className="fixed pointer-events-none z-[100] w-[500px] h-[500px] rounded-full opacity-[0.04] mix-blend-multiply transition-transform duration-300 ease-out"
				style={{
					background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)',
					left: mousePos.x - 250,
					top: mousePos.y - 250,
				}}
			/>

			{/* Background blobs */}
			<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
				<div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-red-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob" style={{ transform: `translate(${scrollY * 0.02}px, ${scrollY * -0.01}px)` }}></div>
				<div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" style={{ transform: `translate(${scrollY * -0.015}px, ${scrollY * 0.02}px)` }}></div>
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-amber-200/20 rounded-full blur-[80px] mix-blend-multiply animate-blob animation-delay-4000"></div>
				<div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
			</div>

			{/* Navbar */}
			<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'py-4' : 'py-8'}`}>
				<div className="max-w-2xl mx-auto px-6">
					<div className={`glass-nav rounded-full px-2 py-2 flex justify-between items-center shadow-lg shadow-red-500/5 ring-1 ring-white/40 backdrop-blur-xl transition-all duration-500 ${scrollY > 50 ? 'bg-white/60' : 'bg-white/30'}`}>
						<div className="flex items-center gap-3 pl-4">
							<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-400 to-blue-400 flex items-center justify-center text-white">
								<Coffee size={16} className="text-white/90" />
							</div>
							<span className="font-semibold text-slate-700 tracking-tight">CodeBreak</span>
						</div>
						<div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
							<a href="#how" className="hover:text-slate-800 transition-colors relative group">
								How it works
								<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-300"></span>
							</a>
							<a href="#stack" className="hover:text-slate-800 transition-colors relative group">
								Stack
								<span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-400 group-hover:w-full transition-all duration-300"></span>
							</a>
						</div>
						<Link href="/interests" className="bg-white text-slate-800 px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 border border-white/50 group">
							<span className="flex items-center gap-2">
								Start a Chat
								<ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
							</span>
						</Link>
					</div>
				</div>
			</nav>

			{/* ==========================================
          HERO
      ========================================== */}
			<main className="relative z-10 pt-44 pb-24 px-6">
				<div className="max-w-7xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-white/50 shadow-sm backdrop-blur-sm mb-8 animate-fade-in-up">
						<span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
						<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">1:1 Coffee Chats • 15 Min</span>
					</div>

					<h1 className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter mb-8 leading-[0.9] text-slate-800">
						<span className="block animate-fade-in-up delay-100">Coffee Break</span>
						<span className="block font-['Instrument_Serif'] italic font-light text-slate-400 mt-2 animate-fade-in-up delay-200">for Devs.</span>
					</h1>

					<div className="max-w-lg mx-auto text-lg md:text-xl leading-relaxed mb-4 animate-fade-in-up delay-300 h-8">
						<TypingText texts={[
							"Talk about what you're building.",
							"Share ideas over a coffee break.",
							"Find your people, one chat at a time.",
							"No networking. Just real conversations.",
						]} />
					</div>

					<p className="max-w-md mx-auto text-base text-slate-400 leading-relaxed mb-12 animate-fade-in-up delay-400">
						Get matched 1:1 with another developer who shares your interests. 15 minutes of real conversation. Then back to work.
					</p>

					<Link href="/interests" className="flex gap-4 justify-center mb-16 animate-fade-in-up delay-500">
						<button className="px-8 py-4 bg-slate-900 text-white rounded-full font-semibold shadow-xl shadow-slate-900/20 hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2 group">
							Find a Match <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
						</button>
					</Link>

					{/* Hero Card */}
					<div className="relative max-w-[360px] mx-auto animate-fade-in-up delay-600">
						<div className="glass p-1 rounded-[2.5rem] bg-gradient-to-b from-white/60 to-white/20 shadow-2xl shadow-red-900/10 border border-white/60 transform transition-transform hover:scale-[1.01] duration-700">
							<div className="bg-white/30 backdrop-blur-md rounded-[2.3rem] px-5 py-5 h-[340px] flex flex-col relative overflow-hidden">
								<div className="flex items-center justify-between mb-3 pb-3 border-b border-white/20">
									<div className="flex items-center gap-2">
										<Coffee size={14} className="text-slate-500" />
										<span className="text-[11px] font-semibold text-slate-600">Coffee Chat — Kubernetes</span>
									</div>
									<div className="flex items-center gap-1.5 bg-green-100/80 px-2 py-0.5 rounded-full">
										<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
										<span className="text-[10px] text-green-700 font-mono font-bold">Live</span>
									</div>
								</div>
								<div className="flex-1 overflow-hidden relative">
									<VideoCallSimulation />
								</div>
							</div>
						</div>

						{/* Decorative Floating Elements — repositioned to avoid overlap */}
						<div className="absolute top-8 -right-16 glass px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg animate-float-slow">
							<div className="bg-blue-100 p-1.5 rounded-full text-blue-600"><Video size={14} /></div>
							<div className="text-[11px] font-bold text-slate-600 leading-tight">HD<br /><span className="font-normal text-slate-400">Video</span></div>
						</div>
						<div className="absolute bottom-8 -left-16 glass px-3 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg animate-float-slow animation-delay-2000">
							<div className="bg-amber-100 p-1.5 rounded-full text-amber-600"><Clock size={14} /></div>
							<div className="text-[11px] font-bold text-slate-600 leading-tight">15m<br /><span className="font-normal text-slate-400">Max</span></div>
						</div>
					</div>
				</div>
			</main>

			<MarqueeStrip />

			{/* ==========================================
          HOW IT WORKS
      ========================================== */}
			<section id="how" className="py-28 relative" ref={processView.ref}>
				<div className="max-w-6xl mx-auto px-6">
					<div className={`mb-16 transition-all duration-1000 ${processView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
						<div className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-500 text-xs font-bold uppercase tracking-widest mb-4">3 Steps</div>
						<h2 className="text-4xl md:text-6xl font-semibold text-slate-800 mb-4">
							How <span className="font-['Instrument_Serif'] italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">it works</span>
						</h2>
						<p className="text-slate-500 text-lg max-w-lg">Grab your coffee. Pick a topic. Meet someone interesting.</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						{features.map((feature, idx) => (
							<div
								key={idx}
								className={`group glass p-8 rounded-[2rem] border border-white/40 hover:bg-white/50 transition-all duration-700 hover:-translate-y-3 relative cursor-default ${processView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
								style={{ transitionDelay: processView.inView ? `${idx * 150}ms` : '0ms' }}
							>
								<div className="absolute top-6 right-6 text-7xl font-black text-slate-200/60 group-hover:text-slate-300 transition-colors select-none">
									0{idx + 1}
								</div>
								<div className={`absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${idx === 0 ? 'bg-gradient-to-br from-amber-50/50' : idx === 1 ? 'bg-gradient-to-br from-blue-50/50' : 'bg-gradient-to-br from-red-50/50'} to-transparent`}></div>
								<div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative z-10`}>
									{feature.icon}
								</div>
								<h3 className="text-xl font-bold text-slate-800 mb-4 relative z-10">{feature.title}</h3>
								<p className="text-slate-500 leading-relaxed relative z-10">{feature.desc}</p>
								{idx < 2 && (
									<div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-slate-200"></div>
								)}
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ==========================================
          TESTIMONIALS (just 2)
      ========================================== */}
			<section className="py-24 px-6" ref={testimonialsView.ref}>
				<div className="max-w-4xl mx-auto">
					<div className={`mb-12 text-center transition-all duration-1000 ${testimonialsView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
						<h2 className="text-3xl md:text-5xl font-semibold text-slate-800">
							Developers <span className="font-['Instrument_Serif'] italic text-slate-400">love it</span>
						</h2>
					</div>
					<div className="grid md:grid-cols-2 gap-6">
						{testimonials.map((t, i) => (
							<div
								key={i}
								className={`glass p-8 rounded-[2rem] border border-white/40 hover:bg-white/50 transition-all duration-700 hover:-translate-y-2 group ${testimonialsView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
								style={{ transitionDelay: testimonialsView.inView ? `${i * 150}ms` : '0ms' }}
							>
								<div className="flex items-center gap-1 mb-4">
									{[...Array(5)].map((_, s) => (
										<Star key={s} size={14} className="text-amber-400 fill-amber-400" />
									))}
								</div>
								<p className="text-slate-700 text-lg leading-relaxed mb-6 font-medium">&ldquo;{t.text}&rdquo;</p>
								<div className="flex items-center gap-3">
									<div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}>{t.avatar}</div>
									<div>
										<div className="text-sm font-bold text-slate-800">{t.name}</div>
										<div className="text-xs text-slate-400">{t.role}</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ==========================================
          TECH STACK
      ========================================== */}
			<section id="stack" className="py-20 px-6" ref={stackView.ref}>
				<div className="max-w-4xl mx-auto text-center">
					<div className={`transition-all duration-1000 ${stackView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
						<h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-12">
							Powered by <span className="font-['Instrument_Serif'] italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">modern tech</span>
						</h2>
					</div>
					<div className="flex flex-wrap justify-center gap-10">
						{techStack.map((tech, i) => (
							<div
								key={i}
								className={`flex flex-col items-center gap-3 group cursor-default transition-all duration-700 ${stackView.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
								style={{ transitionDelay: stackView.inView ? `${i * 100}ms` : '0ms' }}
							>
								<div className="w-20 h-20 rounded-full bg-white/60 shadow-lg shadow-red-900/5 flex items-center justify-center text-slate-400 group-hover:text-red-600 group-hover:scale-110 transition-all duration-500 border border-white backdrop-blur-sm relative overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-br from-red-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
									<div className="relative z-10">
										{React.cloneElement(tech.icon, { size: 28 } as React.Attributes & { size?: number })}
									</div>
								</div>
								<span className="font-medium text-slate-500 text-xs tracking-widest uppercase group-hover:text-slate-700 transition-colors">{tech.name}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ==========================================
          FOOTER CTA
      ========================================== */}
			<footer className="py-20 px-6 relative">
				<div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-red-50/30 to-blue-50/20 pointer-events-none"></div>
				<div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
					<h2 className="text-4xl md:text-7xl font-semibold text-slate-800 mb-4 tracking-tighter">
						Grab a <span className="font-['Instrument_Serif'] italic">coffee</span>.
					</h2>
					<p className="text-slate-500 mb-10 text-lg max-w-sm">Find a developer who cares about the same things you do. 15 minutes is all it takes.</p>

					<button className="px-10 py-5 bg-slate-900 text-white rounded-full font-semibold shadow-xl shadow-slate-900/20 hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-3 text-lg group">
						Start a Coffee Chat <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
					</button>

					<div className="mt-12 flex items-center gap-2">
						<Heart size={14} className="text-red-400" />
						<span className="text-sm text-slate-400">Free. No signup. Just conversations.</span>
					</div>

					<div className="mt-20 w-full pt-8 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
						<div className="flex items-center gap-3">
							<div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-400 to-blue-400 flex items-center justify-center">
								<Coffee size={10} className="text-white" />
							</div>
							<p>CodeBreak — 2024</p>
						</div>
						<div className="flex gap-6 mt-4 md:mt-0">
							<a href="#" className="hover:text-slate-600 transition-colors">GitHub</a>
							<a href="#" className="hover:text-slate-600 transition-colors">Twitter</a>
							<a href="#" className="hover:text-slate-600 transition-colors">Discord</a>
						</div>
					</div>
				</div>
			</footer>

			{/* Styles */}
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');
        .glass { background: rgba(255,255,255,0.4); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
        .glass-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        @keyframes blob { 0%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-50px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} 100%{transform:translate(0,0) scale(1)} }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes float-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        @keyframes fade-in-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; opacity: 0; }
        .delay-100{animation-delay:100ms} .delay-200{animation-delay:200ms} .delay-300{animation-delay:300ms}
        .delay-400{animation-delay:400ms} .delay-500{animation-delay:500ms} .delay-600{animation-delay:700ms}
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .animate-blink { animation: blink 0.8s step-end infinite; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track { animation: marquee 25s linear infinite; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }
      `}</style>
		</div>
	);
}
