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

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mbdjloja';

type AppState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'text_input' | 'waiting_for_response';
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

// Function to render links in messages
const renderMessageWithLinks = (text: string) => {
  // Handle [text](url) format
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the link
    const linkText = match[1];
    const linkUrl = match[2];
    const isJetDemo = linkUrl.includes('getjetsuite.com/demo');
    const displayText = isJetDemo ? linkText : linkUrl;
    
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#60A5FA',
          textDecoration: 'underline',
          fontWeight: 500,
          padding: '2px 0',
          display: 'inline-block'
        }}
      >
        {displayText}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no links were found, return the original text
  if (parts.length === 0) {
    return text;
  }
  
  return parts;
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
    const [audioQueue, setAudioQueue] = useState<AudioBuffer[]>([]);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    const chatRef = useRef<Chat | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const userSpeakingTimeoutRef = useRef<number | null>(null);
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const silenceTimeoutRef = useRef<number | null>(null);
    const autoRestartTimeoutRef = useRef<number | null>(null);
    
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const initChat = useCallback(() => {
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
                "form for you now",
                "provide your details in the form"
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
    };

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
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (autoRestartTimeoutRef.current) {
            clearTimeout(autoRestartTimeoutRef.current);
            autoRestartTimeoutRef.current = null;
        }
        
        setAppState('text_input');
        setCurrentTranscription('');
        
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (error) {
                console.error('Error closing session:', error);
            }
        }
        
        if (currentAudioSourceRef.current) {
            try {
                currentAudioSourceRef.current.stop();
            } catch (error) {
                // Ignore errors when stopping audio
            }
            currentAudioSourceRef.current = null;
        }
        
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            mediaStreamRef.current = null;
        }
        
        audioQueueRef.current = [];
        setIsPlayingAudio(false);
        
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            try {
                await inputAudioContextRef.current.close();
            } catch (error) {
                console.error('Error closing input audio context:', error);
            }
        }
        
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            try {
                await outputAudioContextRef.current.close();
            } catch (error) {
                console.error('Error closing output audio context:', error);
            }
        }
        
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
    }, []);

    const playAudioBuffer = useCallback(async (audioBuffer: AudioBuffer) => {
        if (!outputAudioContextRef.current) {
            console.error('No audio context available');
            return;
        }

        return new Promise<void>((resolve) => {
            try {
                const source = outputAudioContextRef.current!.createBufferSource();
                currentAudioSourceRef.current = source;
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current!.destination);
                
                source.onended = () => {
                    currentAudioSourceRef.current = null;
                    resolve();
                };
                
                source.onerror = (error) => {
                    console.error('Audio playback error:', error);
                    currentAudioSourceRef.current = null;
                    resolve();
                };
                
                source.start();
            } catch (error) {
                console.error('Error starting audio:', error);
                resolve();
            }
        });
    }, []);

    const handleFormSubmit = async (name: string, email: string) => {
        try {
            setShowForm(false);
            setShowCoupon(true);
            
            const couponMessage: Message = { 
                role: Role.ASSISTANT, 
                text: "Excellent! Here is your 20% discount code. You can copy and paste it at checkout.", 
                timestamp: new Date() 
            };
            setMessages(prev => [...prev, couponMessage]);

        } catch (error) {
            console.error('Failed to show coupon:', error);
            alert('Sorry, there was an issue. Please try again.');
        }
    };

    const handleMicClick = async () => {
        const isVoiceMode = appState === 'listening' || appState === 'thinking' || appState === 'speaking' || appState === 'waiting_for_response';
        if (isVoiceMode) {
            await stopRecording();
            return;
        }

        setShowStarters(false);
        setAppState('listening');
        let accumulatedInput = '';
        let accumulatedOutput = '';
        let hasOutputStarted = false;
        let lastInputTime = Date.now();

        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                } 
            });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
                sampleRate: 24000,
                latencyHint: 'playback'
            });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!mediaStreamRef.current || !inputAudioContextRef.current) return;
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(2048, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            if (!inputAudioContextRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const resampledData = resampleBuffer(inputData, inputAudioContextRef.current.sampleRate, 16000);
                            
                            const compressedData = resampledData.map(v => {
                                const compressed = Math.max(-0.9, Math.min(0.9, v));
                                return compressed * 32768;
                            });
                            
                            const pcmBlob: Blob = { 
                                data: encode(new Uint8Array(new Int16Array(compressedData).buffer)), 
                                mimeType: 'audio/pcm;rate=16000' 
                            };
                            
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
                            lastInputTime = Date.now();
                            
                            if (!hasOutputStarted) {
                                setAppState('listening');
                                userSpeakingTimeoutRef.current = window.setTimeout(() => {
                                    if (!hasOutputStarted) setAppState('thinking');
                                }, 2000);
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
                                "form for you now",
                                "form below to unlock your code",
                                "provide your details in the form"
                            ];
                            if (showFormTriggers.some(trigger => accumulatedOutput.toLowerCase().includes(trigger))) {
                                setShowForm(true);
                            }
                            
                            setTimeout(() => {
                                if (appState === 'speaking') {
                                    setAppState('waiting_for_response');
                                    if (autoRestartTimeoutRef.current) {
                                        clearTimeout(autoRestartTimeoutRef.current);
                                    }
                                    autoRestartTimeoutRef.current = window.setTimeout(() => {
                                        if (appState === 'waiting_for_response') {
                                            setAppState('listening');
                                        }
                                    }, 3000);
                                }
                            }, 1000);
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            try {
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                                await playAudioBuffer(audioBuffer);
                            } catch (error) {
                                console.error('Error playing audio:', error);
                            }
                        }
                    },
                    onerror: (e) => { 
                        console.error('Voice session error:', e); 
                        stopRecording(); 
                    },
                    onclose: () => {
                        console.log('Voice session closed');
                        if (appState === 'speaking') {
                            setAppState('waiting_for_response');
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {}, 
                    outputAudioTranscription: {},
                    speechConfig: { 
                        voiceConfig: { 
                            prebuiltVoiceConfig: { 
                                voiceName: 'Zephyr',
                                speakingRate: 1.0,
                                pitch: 0
                            } 
                        } 
                    },
                    systemInstruction: SYSTEM_INSTRUCTION_VOICE,
                },
            });
        } catch (error) {
            console.error('Microphone error:', error);
            alert("Could not start recording. Please ensure microphone permissions are granted.");
            stopRecording();
        }
    };
    
    const turns = groupMessagesIntoTurns(messages);
    const isVoiceMode = appState === 'listening' || appState === 'thinking' || appState === 'speaking' || appState === 'waiting_for_response';

    const isMobile = window.innerWidth <= 768;

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            @keyframes listening-pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes waiting-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            .chat-link {
                color: #60A5FA;
                text-decoration: underline;
                font-weight: 500;
                transition: color 0.2s;
            }
            .chat-link:hover {
                color: #93C5FD;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <>
            {isChatOpen && (
                <div 
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#0F172A',
                        border: '1px solid #1E293B',
                        borderRadius: isMobile ? '20px' : '16px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                        position: 'fixed',
                        bottom: isMobile ? '90px' : '20px',
                        right: isMobile ? '20px' : '20px',
                        width: isMobile ? 'calc(100vw - 40px)' : '400px',
                        height: isMobile ? '75vh' : '600px',
                        maxWidth: '400px',
                        maxHeight: '600px',
                        zIndex: 10000,
                        overflow: 'hidden',
                    }}
                >
                    <header style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderBottom: '1px solid #1E293B',
                        backgroundColor: '#0F172A',
                        borderTopLeftRadius: isMobile ? '20px' : '16px',
                        borderTopRightRadius: isMobile ? '20px' : '16px',
                        position: 'relative',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <GrowthIcon className="w-6 h-6" />
                            <div style={{ marginLeft: '12px' }}>
                                <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', margin: 0 }}>JetSuite Helper</h1>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ 
                                        width: '8px', 
                                        height: '8px', 
                                        borderRadius: '50%', 
                                        backgroundColor: '#10B981',
                                        marginRight: '8px',
                                        animation: appState === 'waiting_for_response' ? 'waiting-pulse 2s infinite' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                    }} />
                                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                        {appState === 'listening' ? 'Listening...' : 
                                         appState === 'thinking' ? 'Thinking...' : 
                                         appState === 'speaking' ? 'Speaking...' :
                                         appState === 'waiting_for_response' ? 'Waiting for response...' : 
                                         'Online and ready to help'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setIsChatOpen(false)} 
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                padding: '8px',
                                zIndex: 1,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    <div 
                        ref={chatContainerRef} 
                        style={{
                            flex: 1,
                            padding: '16px',
                            overflowY: 'auto',
                            backgroundColor: '#0F172A',
                        }}
                    >
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === Role.USER ? 'flex-end' : 'flex-start',
                                    marginBottom: '12px'
                                }}
                            >
                                <div 
                                    style={{
                                        maxWidth: '80%',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        backgroundColor: msg.role === Role.USER ? '#3B82F6' : '#1E293B',
                                        color: 'white',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word'
                                    }}
                                >
                                    {renderMessageWithLinks(msg.text)}
                                </div>
                            </div>
                        ))}

                        {currentTranscription && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                <div style={{
                                    maxWidth: '80%',
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    backgroundColor: '#3B82F6',
                                    color: 'white',
                                    fontSize: '14px',
                                    opacity: 0.7,
                                    wordBreak: 'break-word'
                                }}>
                                    {currentTranscription}
                                </div>
                            </div>
                        )}

                        {showStarters && <ConversationStarters onSelect={handleStarterClick} />}

                        {isLoading && <TypingIndicator />}

                        {showForm && <SignUpForm onSubmit={handleFormSubmit} />}

                        {showCoupon && <CouponDisplay code="TAKE20OFF" />}

                        <AIStatusIndicator state={appState} />
                        
                        {appState === 'waiting_for_response' && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginBottom: '12px',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: '#3B82F6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    animation: 'listening-pulse 1.5s infinite'
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    backgroundColor: '#1E293B',
                                    color: '#9CA3AF',
                                    fontSize: '14px',
                                    wordBreak: 'break-word'
                                }}>
                                    I'm listening... feel free to continue speaking
                                </div>
                            </div>
                        )}
                    </div>

                    <footer style={{
                        padding: '16px',
                        borderTop: '1px solid #1E293B',
                        backgroundColor: '#0F172A',
                        borderBottomLeftRadius: isMobile ? '20px' : '16px',
                        borderBottomRightRadius: isMobile ? '20px' : '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}>
                        {isVoiceMode ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', position: 'relative' }}>
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <VoiceVisualizer 
                                        state={appState as 'listening' | 'thinking' | 'speaking' | 'waiting_for_response'} 
                                        onClick={appState === 'waiting_for_response' ? () => setAppState('listening') : handleMicClick} 
                                    />
                                </div>
                                <button 
                                    onClick={stopRecording} 
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        padding: '8px',
                                        backgroundColor: '#1E293B',
                                        borderRadius: '50%',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                    aria-label="Switch to text input"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            !showForm && !showCoupon && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTextSend()}
                                        placeholder="Ask a question..."
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            backgroundColor: '#1E293B',
                                            border: '1px solid #334155',
                                            borderRadius: '24px',
                                            color: 'white',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <button 
                                        onClick={handleTextSend} 
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#3B82F6',
                                            borderRadius: '50%',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={handleMicClick} 
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#1E293B',
                                            borderRadius: '50%',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        aria-label="Start voice interaction"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </button>
                                </div>
                            )
                        )}
                        
                        <div style={{
                            textAlign: 'center',
                            paddingTop: showForm || showCoupon ? '0' : '8px',
                            borderTop: (showForm || showCoupon) ? 'none' : '1px solid #334155',
                            color: '#9CA3AF',
                            fontSize: '11px',
                        }}>
                            Powered by <a 
                                href="https://jetautomations.ai" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                    color: '#60A5FA', 
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                JetAutomations.ai
                            </a>
                        </div>
                    </footer>
                </div>
            )}

            <FloatingActionButton 
                onClick={() => setIsChatOpen(true)} 
                isHidden={isChatOpen}
            />
        </>
    );
};

export default App;
