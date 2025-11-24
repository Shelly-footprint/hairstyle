import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { CameraCapture } from './components/CameraCapture';
import { Gallery } from './components/Gallery';
import { GeneratedImage } from './types';
import { generateHairSwap, generateLuckyLook, generateDescriptionStyle } from './services/geminiService';
import { Scissors, Sparkles, Wand2, Loader2, Download, Search, Image as ImageIcon, Type, Trash2, Settings2, Globe, Key, ChevronDown, ChevronUp, Shuffle, UserRound } from 'lucide-react';

// --- Translation Dictionary ---
type Language = 'en' | 'zh';

const TRANSLATIONS = {
  en: {
    title: "HairStyle AI",
    stylesGenerated: "styles",
    step1: "1. Your Photo",
    step1Desc: "Upload or take a selfie",
    step2: "2. Choose Mode",
    modeRef: "Match Photo",
    modeText: "Describe",
    modeLucky: "Lucky",
    tabPhoto: "Reference",
    tabText: "Description",
    tabLucky: "Feeling Lucky",
    uploadSelfiePlaceholder: "Upload face",
    uploadRefPlaceholder: "Upload style ref",
    describeStyle: "Describe look (e.g., 'Taylor Swift bangs')...",
    aiSuggest: "AI Suggest",
    generateRefBtn: "Generate from Ref",
    generateTextBtn: "Generate from Text",
    generateLuckyBtn: "I'm Feeling Lucky",
    preferences: "Preferences (Optional)",
    hairLength: "Length",
    hairColor: "Color",
    defaultOption: "Default / Original",
    options: ["Short", "Medium", "Long", "Buzz Cut", "Bald"],
    latestResult: "Result",
    delete: "Delete",
    download: "Save",
    galleryTitle: "History",
    connectAccount: "Set API Key",
    authDesc: "Enter your Gemini API Key to start generating.",
    enterKey: "Enter Gemini API Key",
    saveKey: "Save Key",
    getKey: "Get API Key",
    billingInfo: "Pricing info",
    suggestions: [
      "Cyberpunk neon bob cut",
      "Classic 50s hollywood waves",
      "Messy bun with loose strands",
      "Spiky platinum blonde punk look",
      "Elegent french braid"
    ]
  },
  zh: {
    title: "AI 发型师",
    stylesGenerated: "个发型",
    step1: "1. 您的照片",
    step1Desc: "上传或拍摄正面照",
    step2: "2. 选择模式",
    modeRef: "参考图同款",
    modeText: "文字/智能",
    modeLucky: "手气不错",
    tabPhoto: "参考图",
    tabText: "智能描述",
    tabLucky: "随机盲盒",
    uploadSelfiePlaceholder: "点击上传",
    uploadRefPlaceholder: "上传发型参考图",
    describeStyle: "描述想要的发型，或输入明星名字...",
    aiSuggest: "智能推荐",
    generateRefBtn: "参考图生成",
    generateTextBtn: "文字生成",
    generateLuckyBtn: "手气不错 (生成)",
    preferences: "偏好设置 (可选)",
    hairLength: "长度",
    hairColor: "颜色",
    defaultOption: "默认 / 原样",
    options: ["短发", "中长发", "长发", "寸头", "光头"],
    latestResult: "生成结果",
    delete: "删除",
    download: "保存",
    galleryTitle: "历史记录",
    connectAccount: "设置 API Key",
    authDesc: "请输入您的 Gemini API Key 以开始使用。",
    enterKey: "输入 Gemini API Key",
    saveKey: "保存 Key",
    getKey: "获取 API Key",
    billingInfo: "计费说明",
    suggestions: [
      "赛博朋克霓虹色波波头",
      "经典好莱坞复古大波浪",
      "慵懒随性丸子头",
      "银灰色刺猬头朋克风",
      "优雅法式鱼骨辫"
    ]
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const t = TRANSLATIONS[lang];

  // Auth State
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  const [userImage, setUserImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<boolean>(false);

  // Style Mode State
  const [activeTab, setActiveTab] = useState<'reference' | 'text' | 'lucky'>('reference');

  // Tab Inputs
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string>('');

  // Preferences (Available in Lucky, and maybe others if needed, currently mainly Lucky)
  const [hairLength, setHairLength] = useState<string>('');
  const [hairColor, setHairColor] = useState<string>('');

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [latestImage, setLatestImage] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check API Key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      // If no key, show modal
      setShowKeyModal(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setShowKeyModal(false);
    }
  };

  const addToGallery = (url: string, type: 'swap' | 'lucky') => {
    const newImage: GeneratedImage = {
      id: crypto.randomUUID(),
      url,
      type,
      timestamp: Date.now(),
    };
    setGeneratedImages((prev) => [newImage, ...prev]);
    setLatestImage(newImage);
  };

  const handleDelete = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
    if (latestImage?.id === id) {
      setLatestImage(null);
    }
  };

  const getStyleOptions = () => ({
    hairLength: hairLength || undefined,
    hairColor: hairColor || undefined
  });

  // Consolidated Generate Handler
  const handleGenerate = async () => {
    if (!userImage) return;
    setLoading(true);
    setError(null);

    try {
      let resultUrl: string;
      const options = getStyleOptions();

      if (activeTab === 'reference') {
        if (!styleImage) throw new Error("Please upload a reference style image.");
        // Reference swap usually ignores basic prefs unless we explicitly force them. 
        // For this app, we pass empty options for pure swap, or mixed if user wanted. 
        // Let's keep swap pure as per 'Step 1' description in prompt, but logic supports options.
        resultUrl = await generateHairSwap(userImage, styleImage, {});
        addToGallery(resultUrl, 'swap');
      }
      else if (activeTab === 'text') {
        if (!stylePrompt.trim()) throw new Error("Please describe a style.");
        resultUrl = await generateDescriptionStyle(userImage, stylePrompt, options); // Text mode can use preferences? Maybe better not to confuse prompt. Let's pass empty for now unless explicitly added to UI.
        addToGallery(resultUrl, 'swap');
      }
      else if (activeTab === 'lucky') {
        resultUrl = await generateLuckyLook(userImage, options);
        addToGallery(resultUrl, 'lucky');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggest = () => {
    const random = t.suggestions[Math.floor(Math.random() * t.suggestions.length)];
    setStylePrompt(random);
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `hairstyle-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(base64) => setUserImage(base64)}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 h-14 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="bg-indigo-600 text-white p-1 rounded-md">
              <Scissors size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">{t.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <Key size={14} />
              {apiKey ? 'API Key' : t.connectAccount}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <Globe size={14} />
              {lang === 'en' ? '中文' : 'English'}
            </button>
          </div>
        </div>
      </header>

      {/* Auth Overlay */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t.connectAccount}</h2>
            <p className="text-slate-600 text-sm mb-6">{t.authDesc}</p>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t.enterKey}
              className="w-full p-3 mb-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />

            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {t.saveKey}
            </button>

            <div className="mt-4 flex justify-center gap-4 text-xs">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:underline flex items-center gap-1"
              >
                {t.getKey}
              </a>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-grow flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden`}>

        {/* Sidebar Controls */}
        <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-lg md:shadow-none overflow-y-auto shrink-0">
          <div className="p-5 flex flex-col gap-6">

            {/* STEP 1: User Photo */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {t.step1}
                </h2>
              </div>

              <ImageUploader
                label=""
                image={userImage}
                onImageUpload={setUserImage}
                onClear={() => setUserImage(null)}
                onCameraClick={() => setShowCamera(true)}
                placeholderText={t.uploadSelfiePlaceholder}
              />
            </div>

            <div className="w-full border-t border-slate-100" />

            {/* STEP 2: Choose Mode */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {t.step2}
                </h2>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-3 gap-1 mb-4 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('reference')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${activeTab === 'reference' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <ImageIcon size={18} className="mb-1" />
                  {t.modeRef}
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Type size={18} className="mb-1" />
                  {t.modeText}
                </button>
                <button
                  onClick={() => setActiveTab('lucky')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${activeTab === 'lucky' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  <Sparkles size={18} className="mb-1" />
                  {t.modeLucky}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 flex flex-col gap-4">

                {/* MODE: Reference */}
                {activeTab === 'reference' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <p className="text-xs text-slate-500 mb-2">Upload a photo to copy its hairstyle.</p>
                    <ImageUploader
                      label=""
                      image={styleImage}
                      onImageUpload={setStyleImage}
                      onClear={() => setStyleImage(null)}
                      placeholderText={t.uploadRefPlaceholder}
                    />
                    <button
                      disabled={!userImage || !styleImage || loading}
                      onClick={handleGenerate}
                      className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                      {t.generateRefBtn}
                    </button>
                  </div>
                )}

                {/* MODE: Text */}
                {activeTab === 'text' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-3">
                    <p className="text-xs text-slate-500">Describe specific details or a celebrity style.</p>
                    <div className="relative">
                      <textarea
                        value={stylePrompt}
                        onChange={(e) => setStylePrompt(e.target.value)}
                        placeholder={t.describeStyle}
                        className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                      <button
                        onClick={handleAiSuggest}
                        className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded-md transition-colors"
                        title="Generate a random style prompt"
                      >
                        <Sparkles size={12} />
                        {t.aiSuggest}
                      </button>
                    </div>
                    <button
                      disabled={!userImage || !stylePrompt || loading}
                      onClick={handleGenerate}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                      {t.generateTextBtn}
                    </button>
                  </div>
                )}

                {/* MODE: Lucky */}
                {activeTab === 'lucky' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-4">
                    <p className="text-xs text-slate-500">Let AI pick the best style for your face shape.</p>

                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                      <h3 className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1">
                        <Settings2 size={12} /> {t.preferences}
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-semibold text-orange-700/70 mb-1 block">{t.hairLength}</label>
                          <select
                            value={hairLength}
                            onChange={(e) => setHairLength(e.target.value)}
                            className="w-full p-1.5 text-xs bg-white border border-orange-200 rounded-lg outline-none"
                          >
                            <option value="">{t.defaultOption}</option>
                            {t.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-orange-700/70 mb-1 block">{t.hairColor}</label>
                          <input
                            type="text"
                            value={hairColor}
                            onChange={(e) => setHairColor(e.target.value)}
                            placeholder="e.g. Blonde, Red"
                            className="w-full p-1.5 text-xs bg-white border border-orange-200 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={!userImage || loading}
                      onClick={handleGenerate}
                      className="w-full py-3 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
                      {t.generateLuckyBtn}
                    </button>
                  </div>
                )}

              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </aside>

        {/* Right Area: Results */}
        <section className="flex-1 bg-slate-50 relative overflow-y-auto p-4 md:p-8">
          <div className="w-full flex flex-col gap-6">
            {latestImage && (
              <div className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={20} />
                    {t.latestResult}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(latestImage.id)}
                      className="text-xs bg-white hover:bg-red-50 text-red-600 border border-slate-200 px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Trash2 size={14} /> {t.delete}
                    </button>
                    <button
                      onClick={() => handleDownload(latestImage.url)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent px-2 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Download size={14} /> {t.download}
                    </button>
                  </div>
                </div>

                <div className="relative w-full aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-lg border-4 border-white group">
                  <img
                    src={latestImage.url}
                    alt="Latest Result"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              {generatedImages.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <h3 className="text-slate-400 font-medium text-xs uppercase tracking-widest">{t.galleryTitle}</h3>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
              )}
              <Gallery images={generatedImages} onDelete={handleDelete} />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;