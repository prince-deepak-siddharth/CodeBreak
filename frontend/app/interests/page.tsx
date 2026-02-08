'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function InterestsPage() {
	const router = useRouter();
	const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
	const [categories, setCategories] = useState<{ label: string; items: string[] }[]>([]);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const [githubUrl, setGithubUrl] = useState('');
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState('');

	const handleAnalyze = async () => {
		if (!githubUrl) return;

		setIsAnalyzing(true);
		setError('');

		// Reset categories and selection
		setCategories([]);
		setSelectedInterests([]);

		try {
			const response = await axios.post('http://localhost:3002/api/suggest-interests', {
				githubUrl
			});

			const suggestions = response.data.interests;

			// Set categories with AI results
			setCategories([
				{
					label: 'AI Recommendations',
					items: suggestions
				}
			]);

			// Select them all by default
			setSelectedInterests(suggestions);

		} catch (err) {
			console.error('Analysis failed:', err);
			setError('Failed to analyze profiles. Please try again.');
		} finally {
			setIsAnalyzing(false);
		}
	};

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

	const toggleInterest = (interest: string) => {
		setSelectedInterests((prev) =>
			prev.includes(interest)
				? prev.filter((i) => i !== interest)
				: [...prev, interest]
		);
	};

	const handleStartChat = () => {
		sessionStorage.setItem('userInterests', JSON.stringify(selectedInterests));
		router.push('/chat');
	};

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
				<div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-red-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
				<div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-amber-200/20 rounded-full blur-[80px] mix-blend-multiply animate-blob animation-delay-4000"></div>
			</div>

			{/* Navbar */}
			<nav className="fixed top-0 left-0 right-0 z-50 py-6">
				<div className="max-w-2xl mx-auto px-6">
					<div className="glass-nav rounded-full px-2 py-2 flex justify-between items-center shadow-lg shadow-red-500/5 ring-1 ring-white/40 backdrop-blur-xl bg-white/40">
						<div className="flex items-center gap-3 pl-4">
							<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-400 to-blue-400 flex items-center justify-center text-white">
								<Coffee size={16} className="text-white/90" />
							</div>
							<span className="font-semibold text-slate-700 tracking-tight">CodeBreak</span>
						</div>
						<div className="flex items-center gap-2 text-xs text-slate-400 pr-4">
							<span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
							<span>128 devs online</span>
						</div>
					</div>
				</div>
			</nav>

			{/* Main content */}
			<main className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-32 md:px-8">
				{/* Hero text */}
				<div className="mb-12 text-center animate-fade-in-up">
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-white/50 shadow-sm backdrop-blur-sm mb-6">
						<Sparkles size={14} className="text-amber-500" />
						<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pick Your Interests</span>
					</div>
					<h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-4 leading-[0.95] text-slate-800">
						What gets you
						<span className="block font-['Instrument_Serif'] italic font-light text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 mt-1">
							excited to code?
						</span>
					</h1>
					<p className="max-w-md mx-auto text-base text-slate-400 leading-relaxed">
						Pick your interests and we'll match you with developers who speak your language. The more you pick, the better the match.
					</p>
				</div>

				{/* Auto-fill Section */}
				<div className="mb-12 glass p-6 rounded-2xl border border-white/40 animate-fade-in-up delay-100">
					<div className="flex items-center gap-2 mb-4">
						<Sparkles size={16} className="text-purple-500" />
						<h3 className="font-semibold text-slate-700">Auto-fill with AI</h3>
					</div>
					<div className="grid md:grid-cols-2 gap-4 mb-4">
						<input
							type="text"
							placeholder="GitHub Profile URL"
							value={githubUrl}
							onChange={(e) => setGithubUrl(e.target.value)}
							className="bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
						/>
					</div>
					<button
						onClick={handleAnalyze}
						disabled={isAnalyzing || !githubUrl}
						className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
							${isAnalyzing || !githubUrl
								? 'bg-slate-100 text-slate-400 cursor-not-allowed'
								: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:scale-[1.01]'
							}`}
					>
						{isAnalyzing ? (
							<>
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Analyzing Profiles...
							</>
						) : (
							<>
								<Sparkles size={16} />
								Generate Suggestions
							</>
						)}
					</button>
					{error && (
						<p className="text-red-500 text-xs mt-2 text-center">{error}</p>
					)}
				</div>

				{/* Interest categories */}
				<div className="space-y-8 animate-fade-in-up delay-200">
					{categories.map((category) => (
						<div key={category.label}>
							<h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
								{category.label}
							</h3>
							<div className="flex flex-wrap gap-2.5">
								{category.items.map((interest) => {
									const isSelected = selectedInterests.includes(interest);
									return (
										<button
											key={interest}
											onClick={() => toggleInterest(interest)}
											className={`
												group relative rounded-full border px-5 py-2.5 text-sm font-medium
												transition-all duration-300 ease-out
												${isSelected
													? 'border-red-400/60 bg-gradient-to-r from-red-500/10 to-blue-500/10 text-slate-700 shadow-lg shadow-red-500/10'
													: 'border-white/60 bg-white/50 text-slate-500 hover:border-white/80 hover:bg-white/70 hover:text-slate-700 hover:shadow-md'
												}
											`}
										>
											{isSelected && (
												<span className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/5 to-blue-400/5 animate-pulse" />
											)}
											<span className="relative flex items-center gap-2">
												{isSelected && (
													<svg
														className="h-3.5 w-3.5 text-red-500"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														strokeWidth={3}
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M5 13l4 4L19 7"
														/>
													</svg>
												)}
												{interest}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>

				{/* Bottom action */}
				<div className="mt-16 animate-fade-in-up delay-300">
					{/* Selected count */}
					<div
						className={`mb-5 text-center overflow-hidden transition-all duration-300 ${selectedInterests.length > 0 ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
							}`}
					>
						<p className="text-sm text-slate-500">
							<span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">
								{selectedInterests.length}
							</span>
							{' '}interest{selectedInterests.length !== 1 ? 's' : ''} selected
							{selectedInterests.length >= 3 && (
								<span className="ml-2 text-emerald-500 font-medium">
									— great mix! ✨
								</span>
							)}
						</p>
					</div>

					<button
						onClick={handleStartChat}
						disabled={selectedInterests.length === 0}
						className={`
							group relative w-full overflow-hidden rounded-full px-8 py-5 text-base font-semibold
							transition-all duration-500 ease-out
							${selectedInterests.length === 0
								? 'cursor-not-allowed bg-white/40 text-slate-300 border border-white/40'
								: 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99]'
							}
						`}
					>
						<span className="relative flex items-center justify-center gap-3">
							<Coffee size={18} />
							{selectedInterests.length === 0
								? 'Select some interests to get started'
								: 'Find a Dev to Chat With'}
							{selectedInterests.length > 0 && (
								<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
							)}
						</span>
					</button>

					{/* Feature badges */}
					<div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
						<span className="flex items-center gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
							Interest Matched
						</span>
						<span className="h-3 w-px bg-slate-200" />
						<span className="flex items-center gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
							No Data Stored
						</span>
						<span className="h-3 w-px bg-slate-200" />
						<span className="flex items-center gap-2">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
							Instant Connect
						</span>
					</div>
				</div>
			</main>
		</div>
	);
}
