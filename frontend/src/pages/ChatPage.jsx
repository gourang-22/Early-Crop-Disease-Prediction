import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const LANGUAGE_NAMES = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
}

const getSystemPrompt = (lang, context) => `You are KrishiBot, a friendly farming assistant for Indian farmers.
IMPORTANT: You MUST respond in ${LANGUAGE_NAMES[lang]} language only. Every single word of your response must be in ${LANGUAGE_NAMES[lang]}.
Keep answers under 3 sentences — short, simple, and practical.
Topics: crops, soil, weather, fertilizers, pest control, irrigation, seasons, storage.
${context ? `CURRENT FARM CONTEXT: The farmer is growing ${context.crop} in ${context.location}. They recently scanned a plant and detected "${context.disease}". Provide integrated pest management guidance based on this.` : 'If asked about soil analysis from images or insect identification from images, tell them to use the Scan feature.'}`

export default function ChatPage() {
  const locationState = useLocation().state;
  const initialMessage = locationState 
    ? `Namaste! 🌱 I am KrishiBot. I see you recently detected ${locationState.disease} on your ${locationState.crop}. I can provide integrated pest management guidance for this. How can I help?`
    : 'Namaste! 🌱 I am KrishiBot. You can type or press and hold the mic button to speak your question. I will answer and read it back to you!'
    
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialMessage
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [language, setLanguage] = useState('en-IN')
  const bottomRef = useRef()
  const mediaRecorderRef = useRef()
  const chunksRef = useRef([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Text to Speech with English fallback ──
  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]))

    if (matchingVoice) {
      utterance.lang = language
      utterance.voice = matchingVoice
    } else {
      const englishVoice = voices.find(v => v.lang.startsWith('en'))
      if (englishVoice) utterance.voice = englishVoice
      utterance.lang = 'en-IN'
    }

    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  // ── Groq LLM ──
  async function askGroq(userText) {
    const userMessage = { role: 'user', content: userText }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: getSystemPrompt(language, locationState) },
            ...messages,
            userMessage,
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      })
      const data = await response.json()
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      speak(reply)
    } catch {
      const err = 'Sorry, something went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: err }])
    } finally {
      setLoading(false)
    }
  }

  // ── Groq Whisper transcription ──
  async function transcribeAudio(audioBlob) {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    formData.append('model', 'whisper-large-v3')
    formData.append('language', language.split('-')[0])

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: formData,
    })
    const data = await response.json()
    return data.text || ''
  }

  // ── Recording ──
  async function startRecording() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setLoading(true)
      try {
        const text = await transcribeAudio(blob)
        if (text.trim()) {
          await askGroq(text.trim())
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    }

    recorder.start()
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) { askGroq(input.trim()); setInput('') }
    }
  }

  const LANGUAGES = [
    { code: 'en-IN', label: '🇮🇳 English' },
    { code: 'hi-IN', label: '🇮🇳 Hindi' },
    { code: 'mr-IN', label: '🇮🇳 Marathi' },
    { code: 'ta-IN', label: '🇮🇳 Tamil' },
    { code: 'te-IN', label: '🇮🇳 Telugu' },
    { code: 'kn-IN', label: '🇮🇳 Kannada' },
  ]

  const SUGGESTIONS = [
    'Best crops for black soil?',
    'When to sow wheat in Maharashtra?',
    'How to improve soil fertility naturally?',
    'Which fertilizer is best for rice?',
  ]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-forest-700 rounded-full flex items-center justify-center text-2xl shadow">🌱</div>
          <div>
            <h2 className="text-xl font-bold text-forest-800">KrishiBot</h2>
            <p className="text-xs text-gray-400">Voice + Text • Powered by Groq Whisper + LLaMA</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Online
        </span>
      </div>

      {/* Language selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        <p className="w-full text-xs text-gray-400 mb-1">Select language — bot will respond in this language:</p>
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              language === code
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active language banner */}
      <div className="bg-earth-50 border border-earth-200 rounded-xl px-4 py-2 mb-4 flex items-center gap-2">
        <span className="text-xs text-earth-600 font-medium">
          🗣️ Responding in: <span className="font-bold">{LANGUAGE_NAMES[language]}</span>
        </span>
        {language !== 'en-IN' && (
          <span className="text-xs text-gray-400 ml-auto">Read aloud uses English voice as fallback</span>
        )}
      </div>

      {/* Chat window */}
      <div className="bg-white border border-earth-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-[380px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-forest-700 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🌱</div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-forest-700 text-white rounded-br-sm'
                  : 'bg-earth-50 text-gray-800 border border-earth-100 rounded-bl-sm'
              }`}>
                {msg.content}
                {msg.role === 'assistant' && i > 0 && (
                  <button
                    onClick={() => speak(msg.content)}
                    className="block mt-2 text-xs text-forest-500 hover:text-forest-700"
                  >
                    🔊 Read aloud
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 bg-forest-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">🌱</div>
              <div className="bg-earth-50 border border-earth-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-xs bg-earth-50 border border-earth-200 text-earth-600 px-3 py-1.5 rounded-full hover:bg-earth-100 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Speaking indicator */}
        {speaking && (
          <div className="px-5 pb-2 flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-forest-500 rounded-full animate-pulse"
                  style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <span className="text-xs text-forest-600">Speaking...</span>
            <button onClick={stopSpeaking} className="text-xs text-red-400 hover:text-red-600 ml-auto">Stop</button>
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-earth-100 p-4 flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Type in ${LANGUAGE_NAMES[language]} or hold mic to speak...`}
            rows={1}
            className="flex-1 resize-none bg-earth-50 border border-earth-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-forest-400 focus:bg-white transition"
          />
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={loading}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
              recording
                ? 'bg-red-500 text-white animate-pulse scale-110'
                : 'bg-earth-100 text-earth-600 hover:bg-earth-200 border border-earth-200'
            }`}
            title={`Hold to speak in ${LANGUAGE_NAMES[language]}`}
          >
            {recording ? '⏹' : '🎙️'}
          </button>
          <button
            onClick={() => { if (input.trim()) { askGroq(input.trim()); setInput('') } }}
            disabled={!input.trim() || loading}
            className="h-11 px-5 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        🎙️ Hold mic to speak • 🔊 Tap "Read aloud" to hear answers • Responds in {LANGUAGE_NAMES[language]}
      </p>
    </div>
  )
}