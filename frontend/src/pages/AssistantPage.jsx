import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const LANGUAGE_NAMES = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
}

const LANGUAGES = [
  { code: 'en-IN', label: '🇮🇳 EN' },
  { code: 'hi-IN', label: 'हि' },
  { code: 'mr-IN', label: 'मर' },
  { code: 'ta-IN', label: 'த' },
  { code: 'te-IN', label: 'తె' },
  { code: 'kn-IN', label: 'ಕ' },
]

const getSystemPrompt = (lang, context, farm) => {
  const farmContext = farm
    ? `The farmer is growing ${farm.crop}${farm.crop_variety ? ` (${farm.crop_variety})` : ''} in ${farm.district}, ${farm.state}. Growth stage: ${farm.growth_stage}.`
    : ''
  const diseaseContext = context
    ? `They recently scanned a plant and detected "${context.disease}". Provide integrated pest management guidance based on this.`
    : ''
  return `You are KrishiBot, a friendly and knowledgeable crop health assistant for Indian farmers.
IMPORTANT: Respond ONLY in ${LANGUAGE_NAMES[lang]} language. Every word must be in ${LANGUAGE_NAMES[lang]}.
Be concise — 2-4 sentences max. Be practical and specific to Indian agriculture.
Topics: crop diseases, soil, fertilizers, pest control, irrigation, weather, crop varieties, storage, market prices.
${farmContext} ${diseaseContext}
If asked about topics outside agriculture, politely redirect the conversation.`
}

export default function AssistantPage() {
  const locationState = useLocation().state
  const { activeFarm, user } = useAuth()

  const getDiseaseContext = () => {
    if (locationState?.disease) return locationState
    return null
  }
  const diseaseCtx = getDiseaseContext()

  const getInitialMessage = () => {
    if (diseaseCtx) {
      return `Namaste! 🌱 I see you detected **${diseaseCtx.disease}** on your **${diseaseCtx.crop || activeFarm?.crop || 'crop'}**. I'll provide integrated pest management guidance. What would you like to know?`
    }
    return `Namaste ${user?.name?.split(' ')[0] || ''}! 🌱 I'm KrishiBot, your crop health assistant. Ask me anything about your farm — diseases, fertilizers, weather, or pest control. You can also speak to me using the mic!`
  }

  const [messages, setMessages] = useState([{ role: 'assistant', content: getInitialMessage() }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [language, setLanguage] = useState(user?.language || 'en-IN')
  const bottomRef = useRef()
  const mediaRecorderRef = useRef()
  const chunksRef = useRef([])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]))
    if (matchingVoice) { utterance.lang = language; utterance.voice = matchingVoice }
    else { const en = voices.find(v => v.lang.startsWith('en')); if (en) utterance.voice = en; utterance.lang = 'en-IN' }
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() { window.speechSynthesis.cancel(); setSpeaking(false) }

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
            { role: 'system', content: getSystemPrompt(language, diseaseCtx, activeFarm) },
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
      const err = 'Sorry, something went wrong. Please check your API connection.'
      setMessages(prev => [...prev, { role: 'assistant', content: err }])
    } finally {
      setLoading(false)
    }
  }

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

  async function startRecording() {
    chunksRef.current = []
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setLoading(true)
      try {
        const text = await transcribeAudio(blob)
        if (text.trim()) await askGroq(text.trim())
        else setLoading(false)
      } catch { setLoading(false) }
    }
    recorder.start()
    setRecording(true)
  }

  function stopRecording() { mediaRecorderRef.current?.stop(); setRecording(false) }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) { askGroq(input.trim()); setInput('') }
    }
  }

  const SUGGESTIONS = diseaseCtx
    ? [
        `What are the symptoms of ${diseaseCtx.disease}?`,
        `Best fungicide for ${diseaseCtx.disease}?`,
        `How to prevent ${diseaseCtx.disease} from spreading?`,
        `Organic treatment options?`,
      ]
    : [
        'Best fertilizer for tomato flowering stage?',
        'How to treat early blight organically?',
        'Signs of nitrogen deficiency?',
        'When to harvest tomatoes?',
      ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-forest-700 flex items-center justify-center text-2xl shadow-md">🤖</div>
          <div>
            <h1 className="text-lg font-bold text-charcoal-800">Crop Health Assistant</h1>
            <p className="text-xs text-charcoal-400">Powered by Groq LLaMA · Multilingual Voice Support</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Online
        </span>
      </div>

      {/* Farm context banner */}
      {(activeFarm || diseaseCtx) && (
        <div className="bg-forest-50 border border-forest-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🌾</span>
          <div className="min-w-0">
            {diseaseCtx && (
              <p className="text-xs font-bold text-forest-800">
                Context: {diseaseCtx.disease} detected on {diseaseCtx.crop || activeFarm?.crop}
              </p>
            )}
            {activeFarm && !diseaseCtx && (
              <p className="text-xs font-bold text-forest-800">
                Farm: {activeFarm.name} · {activeFarm.crop} · {activeFarm.growth_stage}
              </p>
            )}
            <p className="text-[10px] text-forest-600 mt-0.5">AI responses are tailored to your farm context</p>
          </div>
        </div>
      )}

      {/* Language selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-charcoal-400">Language:</span>
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
              language === code
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card overflow-hidden">
        <div className="h-[400px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-forest-700 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🤖</div>
              )}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bubble-user' : 'bubble-bot'
              }`}>
                {msg.content}
                {msg.role === 'assistant' && i > 0 && (
                  <button
                    onClick={() => speak(msg.content)}
                    className="block mt-2 text-[10px] text-forest-500 hover:text-forest-700 font-medium"
                  >
                    🔊 Read aloud
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 bg-forest-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">🤖</div>
              <div className="bubble-bot px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs bg-sage-50 border border-sage-200 text-sage-700 px-3 py-1.5 rounded-full hover:bg-sage-100 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Speaking indicator */}
        {speaking && (
          <div className="px-5 py-2 flex items-center gap-2 border-t border-earth-100">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 bg-forest-500 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <span className="text-xs text-forest-600 font-medium">Speaking...</span>
            <button onClick={stopSpeaking} className="text-xs text-red-400 hover:text-red-600 ml-auto">Stop</button>
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-earth-100 p-4 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask in ${LANGUAGE_NAMES[language]}...`}
            rows={1}
            className="flex-1 resize-none bg-earth-50 border border-earth-200 rounded-xl px-4 py-2.5 text-sm text-charcoal-800 placeholder-charcoal-300 focus:outline-none focus:border-forest-400 focus:bg-white transition"
          />
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={loading}
            title="Hold to speak"
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
              recording ? 'bg-red-500 text-white animate-pulse' : 'bg-earth-100 text-charcoal-600 hover:bg-earth-200'
            }`}
          >
            {recording ? '⏹' : '🎙️'}
          </button>
          <button
            onClick={() => { if (input.trim()) { askGroq(input.trim()); setInput('') } }}
            disabled={!input.trim() || loading}
            className="h-10 px-5 bg-forest-700 text-white rounded-xl text-sm font-semibold hover:bg-forest-600 disabled:opacity-40 transition flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-xs text-charcoal-400 text-center">
        🎙️ Hold mic to speak · 🔊 Tap Read aloud · Responds in {LANGUAGE_NAMES[language]}
      </p>
    </div>
  )
}
