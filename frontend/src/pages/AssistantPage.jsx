import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'http://localhost:8000'

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

export default function AssistantPage() {
  const locationState = useLocation().state
  const { activeFarm, user } = useAuth()

  const getDiseaseContext = () => {
    if (locationState?.disease || locationState?.plant_identified) return locationState
    return null
  }
  const diseaseCtx = getDiseaseContext()

  const getInitialMessage = () => {
    if (diseaseCtx) {
      if (diseaseCtx.crop_match === false && diseaseCtx.plant_identified) {
        return `Namaste! 🌱 I see you uploaded an image identified as **${diseaseCtx.plant_identified}** (while your registered farm crop is **${diseaseCtx.expected_crop || activeFarm?.crop}**), showing signs of **${diseaseCtx.disease || 'an issue'}**. I'm here to provide advice for this plant. What would you like to ask?`
      }
      return `Namaste! 🌱 I see you detected **${diseaseCtx.disease}** on your **${diseaseCtx.plant_identified || diseaseCtx.crop || activeFarm?.crop || 'crop'}**. I'll provide integrated pest management guidance. What would you like to know?`
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
  const recognitionRef = useRef(null)

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

  async function sendMessage(userText) {
    if (!userText?.trim() || loading) return

    const userMessage = { role: 'user', content: userText.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText.trim(),
          language: language,
          crop: diseaseCtx?.plant_identified || activeFarm?.crop,
          crop_variety: activeFarm?.crop_variety,
          growth_stage: activeFarm?.growth_stage,
          district: activeFarm?.district,
          state: activeFarm?.state,
          disease_context: diseaseCtx?.disease,
          plant_identified: diseaseCtx?.plant_identified,
          expected_crop: diseaseCtx?.expected_crop || activeFarm?.crop,
          crop_match: diseaseCtx?.crop_match,
          confidence: diseaseCtx?.confidence,
          risk_level: diseaseCtx?.risk_level,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()
      const reply = data.reply || 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      speak(reply)
    } catch (err) {
      console.error('Assistant request failed:', err)
      const errReply = 'Sorry, something went wrong. Please check that the AI service is running on port 8000.'
      setMessages(prev => [...prev, { role: 'assistant', content: errReply }])
    } finally {
      setLoading(false)
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your message.')
      return
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      const recognition = new SpeechRecognition()
      recognition.lang = language
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setRecording(true)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (transcript && transcript.trim()) {
          sendMessage(transcript.trim())
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setRecording(false)
      }

      recognition.onend = () => {
        setRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error('Failed to start speech recognition:', e)
      setRecording(false)
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore if already stopped
      }
    }
    setRecording(false)
  }

  function toggleListening() {
    if (recording) {
      stopListening()
    } else {
      startListening()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        sendMessage(input.trim())
      }
    }
  }

  const plantName = diseaseCtx?.plant_identified || diseaseCtx?.crop || activeFarm?.crop || 'crop'
  const SUGGESTIONS = diseaseCtx
    ? [
        `What are symptoms of ${diseaseCtx.disease || 'this condition'} in ${plantName}?`,
        `Recommended fungicide or organic control for ${diseaseCtx.disease || 'this'}?`,
        `How quickly can this spread to other plants?`,
        `Can I prevent this organically?`,
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
            <p className="text-xs text-charcoal-400">Powered by Google Gemini · Multilingual Voice Support</p>
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
            {diseaseCtx?.crop_match === false && diseaseCtx.plant_identified ? (
              <p className="text-xs font-bold text-amber-900">
                Context: {diseaseCtx.plant_identified} (Expected farm crop: {diseaseCtx.expected_crop || activeFarm?.crop}) · {diseaseCtx.disease || 'Health Inquiry'}
              </p>
            ) : diseaseCtx ? (
              <p className="text-xs font-bold text-forest-800">
                Context: {diseaseCtx.disease} on {diseaseCtx.plant_identified || diseaseCtx.crop || activeFarm?.crop}
              </p>
            ) : activeFarm ? (
              <p className="text-xs font-bold text-forest-800">
                Farm: {activeFarm.name} · {activeFarm.crop} · {activeFarm.growth_stage}
              </p>
            ) : null}
            <p className="text-[10px] text-forest-600 mt-0.5">AI responses are tailored to your farm and plant context</p>
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
            onClick={toggleListening}
            disabled={loading}
            title={recording ? 'Click to stop listening' : 'Click to speak'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
              recording ? 'bg-red-500 text-white animate-pulse' : 'bg-earth-100 text-charcoal-600 hover:bg-earth-200'
            }`}
          >
            {recording ? '⏹' : '🎙️'}
          </button>
          <button
            onClick={() => { if (input.trim()) { sendMessage(input.trim()) } }}
            disabled={!input.trim() || loading}
            className="h-10 px-5 bg-forest-700 text-white rounded-xl text-sm font-semibold hover:bg-forest-600 disabled:opacity-40 transition flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-xs text-charcoal-400 text-center">
        🎙️ Tap mic to speak · 🔊 Tap Read aloud · Responds in {LANGUAGE_NAMES[language]}
      </p>
    </div>
  )
}
