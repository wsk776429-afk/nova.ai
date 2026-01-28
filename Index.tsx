import { useState, useCallback, useEffect, useRef } from 'react';
import { AvatarCanvas } from '@/components/avatar/AvatarCanvas';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useEmotionController } from '@/hooks/useEmotionController';
import { useSpeech } from '@/hooks/useSpeech';
import type { Emotion } from '@/types/avatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const emotionController = useEmotionController();
  const speech = useSpeech();
  
  const mouthAnimationRef = useRef<number | null>(null);

  // Sync speech state with emotion controller
  useEffect(() => {
    emotionController.setIsListening(speech.isListening);
    emotionController.setIsSpeaking(speech.isSpeaking);
  }, [speech.isListening, speech.isSpeaking, emotionController]);

  // Animate mouth when speaking
  useEffect(() => {
    if (speech.isSpeaking) {
      const animate = () => {
        // Random mouth movement for speaking effect
        const openness = 0.3 + Math.random() * 0.5;
        emotionController.setMouthOpenness(openness);
        mouthAnimationRef.current = requestAnimationFrame(animate);
      };
      mouthAnimationRef.current = requestAnimationFrame(animate);
    } else {
      if (mouthAnimationRef.current) {
        cancelAnimationFrame(mouthAnimationRef.current);
      }
      emotionController.setMouthOpenness(0);
    }

    return () => {
      if (mouthAnimationRef.current) {
        cancelAnimationFrame(mouthAnimationRef.current);
      }
    };
  }, [speech.isSpeaking, emotionController]);

  const handleSendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    // Set thinking emotion while processing
    emotionController.setEmotion('thinking', 0.6);

    // Simulate AI response (will be replaced with actual AI call in Phase 2)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock response with emotion
      const emotions: Emotion[] = ['happy', 'neutral', 'thinking'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      const responses = [
        { text: "That's awesome! I love hearing about that!", emotion: 'happy' as Emotion },
        { text: "Interesting... let me think about that for a moment.", emotion: 'thinking' as Emotion },
        { text: "I hear you! Tell me more about it.", emotion: 'neutral' as Emotion },
        { text: "Oh, that's really cool! Gaming is the best!", emotion: 'happy' as Emotion },
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.text,
        emotion: response.emotion,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      emotionController.setEmotion(response.emotion, 0.7);
      
      // Speak the response
      if (speech.isSupported) {
        await speech.speak(response.text, (progress) => {
          emotionController.setMouthOpenness(0.2 + progress * 0.4);
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      emotionController.setEmotion('sad', 0.5);
    } finally {
      setIsLoading(false);
    }
  }, [emotionController, speech]);

  // Handle speech recognition result
  useEffect(() => {
    if (speech.transcript && !speech.isListening) {
      handleSendMessage(speech.transcript);
    }
  }, [speech.isListening]); // Only trigger when listening stops

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Nova AI
          </h1>
          <p className="text-muted-foreground">
            Your interactive AI gaming companion
          </p>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Avatar */}
          <div className="order-1 lg:order-1">
            <AvatarCanvas 
              avatarState={emotionController.state}
            />
          </div>

          {/* Chat */}
          <div className="order-2 lg:order-2 h-full min-h-[400px]">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isListening={speech.isListening}
              isSpeaking={speech.isSpeaking}
              isLoading={isLoading}
              onStartListening={speech.startListening}
              onStopListening={speech.stopListening}
              onStopSpeaking={speech.stopSpeaking}
              transcript={speech.transcript}
              isVoiceSupported={speech.isSupported}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
