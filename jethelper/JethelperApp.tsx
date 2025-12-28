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
import { sendMessageToAI as sendTextMessageToAI } from './services/JethelperGeminiService';
import { GrowthIcon } from './components/JethelperGrowthIcon';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// Audio helper functions from GETLYFE
function downsampleTo16k(buffer: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return buffer;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.ceil(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const x = i * ratio;
    const index = Math.floor(x);
    const t = x - index;
    const v0 = buffer[index];
    const v1 = buffer[index + 1] || v0;
    result[i] = v0 * (1 - t) + v1 * t;
  }
  return result;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return { 
    data: encode(new Uint8Array(int16.buffer)), 
    mimeType: 'audio/pcm;rate=16000' 
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const dataInt16 = new Int16Array(arrayBuffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

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
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    // Voice refs - using GETLYFE approach
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const liveSessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const currentInputTranscription = useRef('');
    const isVoiceActiveRef = useRef(false);

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

    // Voice functions using GETLYFE approach
    const stopVoiceMode = useCallback(() => {
        setAppState('text_input');
        setCurrentTranscription('');
        isVoiceActiveRef.current = false;
        
        if (liveSessionRef.current) {
            liveSessionRef.current = null;
        }
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        if (audioSourcesRef.current) {
            audioSourcesRef.current.forEach(source => source.stop());
            audioSourcesRef.current.clear();
        }
        
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close().catch(() => {});
            inputAudioContextRef.current = null;
        }
        
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close().catch(() => {});
            outputAudioContextRef.current = null;
        }
    }, []);

    const startVoiceMode = async () => {
        if (isVoiceActiveRef.current) {
            stopVoiceMode();
            return;
        }
        
        if (!window.isSecureContext) {
            setMessages(prev => [...prev, { 
                role: Role.ASSISTANT, 
                text: "Voice Mode Error: Browser security requires an HTTPS connection to access the microphone.",
                timestamp: new Date()
            }]);
            return;
        }

        setAppState('listening');
        setShowStarters(false);
        isVoiceActiveRef.current = true;
        setCurrentTranscription('');
        
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            inputAudioContextRef.current = new AudioContextClass();
            outputAudioContextRef.current = new AudioContextClass();

            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            mediaStreamRef.current = stream;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: SYSTEM_INSTRUCTION_VOICE,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        const inputSampleRate = inputAudioContextRef.current.sampleRate;
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (!inputAudioContextRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const downsampledData = downsampleTo16k(inputData, inputSampleRate);
                            const pcmBlob = createBlob(downsampledData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        
                        source.connect(scriptProcessor);
                        const muteNode = inputAudioContextRef.current.createGain();
                        muteNode.gain.value = 0;
                        scriptProcessor.connect(muteNode);
                        muteNode.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const inputTrans = message.serverContent?.inputTranscription?.text;
                        const outputTrans = message.serverContent?.outputTranscription?.text;
                        
                        // Handle input transcription
                        if (inputTrans) {
                            currentInputTranscription.current += inputTrans;
                            setCurrentTranscription(currentInputTranscription.current);
                            setAppState('listening');
                        }
                        
                        // Handle output transcription
                        if (outputTrans) {
                            setAppState('speaking');
                        }
                        
                        // Handle turn completion
                        if (message.serverContent?.turnComplete) {
                            if (currentInputTranscription.current) {
                                const userMessage: Message = { 
                                    role: Role.USER, 
                                    text: currentInputTranscription.current, 
                                    timestamp: new Date() 
                                };
                                const assistantMessage: Message = {
                                    role: Role.ASSISTANT,
                                    text: message.serverContent.outputTranscription?.text || '',
                                    timestamp: new Date()
                                };
                                
                                setMessages(prev => [...prev, userMessage, assistantMessage]);
                                
                                const showFormTriggers = [
                                    "form for you now",
                                    "form below to unlock your code",
                                    "provide your details in the form"
                                ];
                                if (showFormTriggers.some(trigger => 
                                    assistantMessage.text.toLowerCase().includes(trigger))) {
                                    setShowForm(true);
                                }
                                
                                currentInputTranscription.current = '';
                                setCurrentTranscription('');
                                
                                // After speaking, wait for response
                                setTimeout(() => {
                                    setAppState('waiting_for_response');
                                    setTimeout(() => {
                                        if (appState === 'waiting_for_response') {
                                            setAppState('listening');
                                        }
                                    }, 3000);
                                }, 1000);
                            }
                        }
                        
                        // Handle audio playback
                        const parts = message.serverContent?.modelTurn?.parts || [];
                        for (const part of parts) {
                            const audioData = part.inlineData?.data;
                            if (audioData && outputAudioContextRef.current) {
                                const ctx = outputAudioContextRef.current;
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                                const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                                const source = ctx.createBufferSource();
                                source.buffer = audioBuffer;
                                const outputNode = ctx.createGain();
                                source.connect(outputNode);
                                outputNode.connect(ctx.destination);
                                source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                audioSourcesRef.current.add(source);
                            }
                        }
                        
                        // Handle interruption
                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(src => src.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setCurrentTranscription('');
                        }
                    },
                    onclose: () => {
                        stopVoiceMode();
                    },
                    onerror: (error: any) => {
                        console.error('Voice session error:', error);
                        stopVoiceMode();
                    }
                }
            });
            
            liveSessionRef.current = sessionPromise;
        } catch (error: any) {
            console.error('Microphone error:', error);
            alert("Could not start recording. Please ensure microphone permissions are granted.");
            stopVoiceMode();
        }
    };

    const handleMicClick = async () => {
        if (isVoiceActiveRef.current) {
            stopVoiceMode();
        } else {
            startVoiceMode();
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
                                        onClick={handleMicClick} 
                                    />
                                </div>
                                <button 
                                    onClick={stopVoiceMode} 
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
