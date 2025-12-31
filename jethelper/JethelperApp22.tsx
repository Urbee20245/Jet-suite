// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Role } from './JethelperTypes';
import { SignUpForm } from './components/JethelperSignUpForm';
import { CouponDisplay } from './components/JethelperCouponDisplay';
import { VoiceVisualizer } from './components/JethelperVoiceVisualizer';
import { SearchResultCard } from './components/JethelperSearchResultCard';
import { FloatingActionButton } from './components/JethelperFloatingActionButton';
import { AIStatusIndicator } from './components/JethelperAIStatusIndicator';
import { ConversationStarters } from './components/JethelperConversationStarters';
import { TypingIndicator } from './components/JethelperTypingIndicator';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession, Chat } from '@google/genai';
import { SYSTEM_INSTRUCTION, SYSTEM_INSTRUCTION_VOICE } from './JethelperConstants';
import { decode, encode, decodeAudioData, resampleBuffer } from './utils/JethelperAudio';
import { sendMessageToAI as sendTextMessageToAI } from './services/JethelperGeminiService';
import { GrowthIcon } from './components/JethelperGrowthIcon';

// CRITICAL FIX: Remove top-level initialization and error throw
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("JETHELPER: API_KEY environment variable not set. Voice/Chat features disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

// IMPORTANT: Replace this with your own Formspree endpoint URL.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mbdjloja';

type AppState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'text_input';
type Turn = { id: number; userQuery?: string; aiResponse: string; };

const groupMessagesIntoTurns = (messages: Message[]): Turn[] => {
    const turns: Turn[] = [];
    let userMessage: string | undefined = undefined;
    
    messages.forEach((msg, index) => {
        if (msg.role === Role.USER) {
            userMessage = msg.text;
        } else if (msg.role === Role.ASSISTANT) {
            turns.push({
                id: index,
                userQuery: userMessage,
                aiResponse: msg.text
            });
            userMessage = undefined;
        }
    });

    return turns;
};


const App: React.FC = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [appState, setAppState] = useState<AppState>('text_input');
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showCoupon, setShowCoupon] = useState(false);
    const [currentTranscription, setCurrentTranscription] = useState('');
    const [showStarters, setShowStarters] = useState(true);

    const chatRef = useRef<Chat | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const userSpeakingTimeoutRef = useRef<number | null>(null);
    
    // Audio refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const initChat = useCallback(() => {
        const ai = getAiClient();
        if (!ai) {
            setMessages([{ 
                role: Role.ASSISTANT, 
                text: "👋 Hi! I'm JetBot. My AI features are currently disabled due to a missing API key, but I can still provide links and basic information.", 
                timestamp: new Date() 
            }]);
            return;
        }
        
        if (messages.length > 0) return;

        const welcomeMessage = "Welcome to JetSuite. I'm your AI guide. Feel free to ask me anything by typing or using your voice. How can I help you today?";
        setMessages([{ role: Role.ASSISTANT, text: welcomeMessage, timestamp: new Date() }]);
        setShowStarters(true);

        chatRef.current = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            },
        });
    }, [messages.length]);

    useEffect(() => {
        if (isChatOpen) {
            initChat();
        }
    }, [isChatOpen, initChat]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [messages, isLoading, showForm, showCoupon, currentTranscription, appState, showStarters]);

    const sendMessage = async (messageText: string) => {
        const ai = getAiClient();
        if (!ai) {
            setMessages(prev => [...prev, { role: Role.ASSISTANT, text: "AI features are currently disabled. Please check the console for details.", timestamp: new Date() }]);
            return;
        }
        
        setIsLoading(true);
        setShowStarters(false);
        try {
            if (!chatRef.current) {
                chatRef.current = ai.chats.create({
                    model: 'gemini-3-flash-preview',
                    config: { systemInstruction: SYSTEM_INSTRUCTION },
                });
            }

            const { responseText } = await sendTextMessageToAI(chatRef.current, messageText);
            const aiMessage: Message = { role: Role.ASSISTANT, text: responseText, timestamp: new Date() };
            setMessages(prev => [...prev, aiMessage]);
            
            const showFormTriggers = [
                "form below to unlock your code", 
            ];
            if (showFormTriggers.some(trigger => responseText.toLowerCase().includes(trigger))) {
                setShowForm(true);
            }
        } catch (error) {
            console.error(error);
            const errorMsg: Message = { role: Role.ASSISTANT, text: "Sorry, something went wrong. Please try again.", timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }

    const handleTextSend = async () => {
        if (!userInput.trim()) return;
        const currentInput = userInput;
        const newUserMessage: Message = { role: Role.USER, text: currentInput, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        await sendMessage(currentInput);
    };
    
    const handleStarterClick = async (starterText: string) => {
        const newUserMessage: Message = { role: Role.USER, text: starterText, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMessage]);
        await sendMessage(starterText);
    };

    const stopRecording = useCallback(async () => {
        if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
            userSpeakingTimeoutRef.current = null;
        }
        setAppState('text_input');
        setCurrentTranscription('');
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
        }
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
    }, []);

    const handleMicClick = async () => {
        const ai = getAiClient();
        if (!ai) {
            setMessages(prev => [...prev, { 
                role: Role.ASSISTANT, 
                text: "Voice Mode is disabled due to a missing API key.",
                timestamp: new Date()
            }]);
            return;
        }
        
        const isVoiceMode = appState === 'listening' || appState === 'thinking' || appState === 'speaking';
        if (isVoiceMode) {
            await stopRecording();
            return;
        }

        setShowStarters(false);
        setAppState('listening');
        let accumulatedInput = '';
        let accumulatedOutput = '';
        let hasOutputStarted = false;


        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!mediaStreamRef.current || !inputAudioContextRef.current) return;
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            if (!inputAudioContextRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const resampledData = resampleBuffer(inputData, inputAudioContextRef.current.sampleRate, 16000);
                            const pcmBlob: Blob = { data: encode(new Uint8Array(new Int16Array(resampledData.map(v => v * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message) => {
                        if (userSpeakingTimeoutRef.current) {
                            clearTimeout(userSpeakingTimeoutRef.current);
                        }

                        const isOutputting = message.serverContent?.outputTranscription || message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;

                        if (isOutputting && !hasOutputStarted) {
                            hasOutputStarted = true;
                            setAppState('speaking');
                        }

                        if (message.serverContent?.inputTranscription) {
                             if (!hasOutputStarted) {
                                setAppState('listening');
                                userSpeakingTimeoutRef.current = window.setTimeout(() => {
                                    if (!hasOutputStarted) setAppState('thinking');
                                }, 1500);
                            }
                            accumulatedInput += message.serverContent.inputTranscription.text;
                            setCurrentTranscription(accumulatedInput);
                        }
                       
                        if (message.serverContent?.outputTranscription) {
                            accumulatedOutput += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            setMessages(prev => [
                                ...prev,
                                { role: Role.USER, text: accumulatedInput, timestamp: new Date() },
                                { role: Role.ASSISTANT, text: accumulatedOutput, timestamp: new Date() },
                            ]);

                            const showFormTriggers = [
                                "form for you now" 
                            ];
                            if (showFormTriggers.some(trigger => accumulatedOutput.toLowerCase().includes(trigger))) {
                                setShowForm(true);
                            }
                            stopRecording();
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.start();
                        }
                    },
                    onerror: (e) => { console.error(e); stopRecording(); },
                    onclose: () => {},
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {}, outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: SYSTEM_INSTRUCTION_VOICE,
                },
            });
        } catch (error) {
            alert("Could not start recording. Please ensure microphone permissions are granted.");
            stopRecording();
        }
    };
    
    const handleFormSubmit = async (name: string, email: string) => {
        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email }),
            });

            if (!response.ok) {
                throw new Error('Form submission failed');
            }

            setShowForm(false);
            setShowCoupon(true);
            const couponMessage: Message = { role: Role.ASSISTANT, text: "Excellent! Here is your coupon code. You can use it at checkout.", timestamp: new Date() };
            setMessages(prev => [...prev, couponMessage]);

        } catch (error) {
            console.error('Failed to submit form:', error);
            alert('Sorry, there was an issue submitting your information. Please try again.');
        }
    };

    const turns = groupMessagesIntoTurns(messages);
    const isVoiceMode = appState === 'listening' || appState === 'thinking' || appState === 'speaking';


    return (
        <div className="jetsuite-widget-container font-sans">
            <div className={`jetsuite-chat-window ${isChatOpen ? '' : 'closed'} bg-[#10182A] border border-[#28334E] rounded-2xl flex flex-col`}>
                <header className="flex items-center justify-between p-4 border-b border-[#28334E] bg-[#10182A]/80 backdrop-blur-sm rounded-t-2xl">
                    <div className="flex items-center">
                        <GrowthIcon className="w-6 h-6" />
                        <div className="ml-3">
                            <h1 className="text-md font-bold text-white">JetSuite Helper</h1>
                            <div className="flex items-center mt-1">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <p className="text-xs text-gray-400">Online and ready to help</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-6">
                    {turns.map((turn) => <SearchResultCard key={turn.id} userQuery={turn.userQuery} aiResponse={turn.aiResponse} />)}
                    {currentTranscription && <SearchResultCard userQuery={currentTranscription} />}
                    {showStarters && <ConversationStarters onSelect={handleStarterClick} />}
                    {isLoading && <TypingIndicator />}
                    {showForm && <SignUpForm onSubmit={handleFormSubmit} />}
                    {showCoupon && <CouponDisplay code="TAKE20OFF" />}
                    <AIStatusIndicator state={appState} />
                </div>

                <footer className="p-4 border-t border-[#28334E]">
                    {isVoiceMode ? (
                        <div className="flex items-center justify-center h-20 relative">
                            <div className="flex-1 flex justify-center">
                                <VoiceVisualizer state={appState as 'listening' | 'thinking' | 'speaking'} onClick={handleMicClick} />
                            </div>
                            <button 
                                onClick={stopRecording} 
                                className="absolute right-0 p-2 bg-[#1E293B] rounded-full text-white hover:bg-[#28334E]" 
                                aria-label="Switch to text input"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    ) : (
                        !showForm && !showCoupon && (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleTextSend()}
                                    placeholder="Ask a question..."
                                    className="flex-1 px-4 py-2 bg-[#1E293B] border border-[#28334E] rounded-full focus:outline-none focus:ring-2 focus:ring-[#4A69FF] text-white placeholder-gray-500"
                                />
                                <button onClick={handleTextSend} className="p-2 bg-[#4A69FF] rounded-full text-white hover:bg-[#3A56D5]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </button>
                                <button onClick={handleMicClick} className="p-2 bg-[#1E293B] rounded-full text-white hover:bg-[#28334E]" aria-label="Start voice interaction">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                </button>
                            </div>
                        )
                    )}
                </footer>
            </div>
            <FloatingActionButton onClick={() => setIsChatOpen(true)} isHidden={isChatOpen} />
        </div>
    );
};

export default App;