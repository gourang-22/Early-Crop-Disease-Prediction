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

const INITIAL_GREETINGS = {
  'en-IN': {
    disease: (crop, disease) => `Namaste! 🌱 I see you detected **${disease}** on your **${crop}**. I'll provide integrated pest management guidance. What would you like to know?`,
    mismatch: (plant, expected, disease) => `Namaste! 🌱 I see you uploaded an image identified as **${plant}** (while your registered farm crop is **${expected}**), showing signs of **${disease || 'an issue'}**. I'm here to provide advice for this plant. What would you like to ask?`,
    general: (name) => `Namaste ${name ? name + '! ' : ''}🌱 I'm KrishiBot, your crop health assistant. Ask me anything about your farm — diseases, fertilizers, weather, or pest control. You can also upload a leaf photo or speak with the mic!`,
  },
  'hi-IN': {
    disease: (crop, disease) => `नमस्ते! 🌱 आपकी फसल **${crop}** में **${disease}** के लक्षण पाए गए हैं। मैं इसके प्रबंधन, रोकथाम और उपचार के लिए मार्गदर्शन दे सकता हूँ। आप क्या जानना चाहते हैं?`,
    mismatch: (plant, expected, disease) => `नमस्ते! 🌱 आपने **${plant}** की छवि अपलोड की है (जबकि पंजीकृत फसल **${expected}** है), जिसमें **${disease || 'रोग'}** के लक्षण हैं। इस पौधे के उपचार के लिए आप क्या पूछना चाहते हैं?`,
    general: (name) => `नमस्ते ${name ? name + '! ' : ''}🌱 मैं कृषि-बॉट हूँ, आपका फसल स्वास्थ्य सहायक। अपनी फसल, रोग, खाद, मौसम या कीट प्रबंधन के बारे में कुछ भी पूछें। आप फोटो भी अपलोड कर सकते हैं या माइक से बोल सकते हैं!`,
  },
  'mr-IN': {
    disease: (crop, disease) => `नमस्ते! 🌱 तुमच्या **${crop}** पिकावर **${disease}** चा प्रादुर्भाव आढळला आहे. मी याच्या योग्य व्यवस्थापन आणि उपायांसाठी मार्गदर्शन करेन. तुम्हाला काय विचारायचे आहे?`,
    mismatch: (plant, expected, disease) => `नमस्ते! 🌱 तुम्ही अपलोड केलेला फोटो **${plant}** चा आहे (नोंदणीकृत पीक **${expected}** आहे), ज्यावर **${disease || 'रोग'}** दिसत आहे. मी तुम्हाला काय मदत करू शकतो?`,
    general: (name) => `नमस्ते ${name ? name + '! ' : ''}🌱 मी कृषी-बॉट आहे, तुमचा पीक सल्लागार. रोग, खते, कीटक नियंत्रण किंवा हवामानाबद्दल काहीही विचारा. फोटो अपलोड करूनही विचारू शकता!`,
  },
  'ta-IN': {
    disease: (crop, disease) => `வணக்கம்! 🌱 உங்கள் **${crop}** பயிரில் **${disease}** பாதிப்பு கண்டறியப்பட்டுள்ளது. ஒருங்கிணைந்த பயிர் பாதுகாப்பு மற்றும் மேலாண்மைக்கு நான் வழிகாட்டுகிறேன். என்ன கேட்க விரும்புகிறீர்கள்?`,
    mismatch: (plant, expected, disease) => `வணக்கம்! 🌱 நீங்கள் பதிவேற்றிய படம் **${plant}** (பண்ணை பயிர்: **${expected}**), இதில் **${disease || 'பாதிப்பு'}** அறிகுறி உள்ளது. இந்த செடிக்கான ஆலோசனைகளை கேட்கலாம்.`,
    general: (name) => `வணக்கம் ${name ? name + '! ' : ''}🌱 நான் கிருஷி-பாட், உங்கள் பயிர் நல உதவியாளர். பயிர் நோய்கள், உரங்கள், பூச்சி கட்டுப்பாடு அல்லது வானிலை பற்றி கேளுங்கள்! புகைப்படமும் பதிவேற்றலாம்.`,
  },
  'te-IN': {
    disease: (crop, disease) => `నమస్కారం! 🌱 మీ **${crop}** పంటలో **${disease}** గుర్తించబడింది. సమగ్ర నివారణ చర్యలు మరియు సలహాల కోసం నేను సిద్ధంగా ఉన్నాను. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?`,
    mismatch: (plant, expected, disease) => `నమస్కారం! 🌱 మీరు అప్‌లోడ్ చేసిన చిత్రం **${plant}** (మీ పొలం పంట **${expected}**), దీనిలో **${disease || 'సమస్య'}** లక్షణాలు ఉన్నాయి. దీనిపై మీరు ఏమి అడగాలనుకుంటున్నారు?`,
    general: (name) => `నమస్కారం ${name ? name + '! ' : ''}🌱 నేను కృషి-బాట్, మీ పంట ఆరోగ్య సహాయకుడిని. పంట వ్యాధులు, ఎరువులు లేదా తెగుళ్ల నివారణ గురించి నన్ను అడగండి. ఫోటో కూడా అప్‌లోడ్ చేయవచ్చు!`,
  },
  'kn-IN': {
    disease: (crop, disease) => `ನಮಸ್ಕಾರ! 🌱 ನಿಮ್ಮ **${crop}** ಬೆಳೆಯಲ್ಲಿ **${disease}** ರೋಗದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ. ಇದರ ಸೂಕ್ತ ನಿರ್ವಹಣೆ ಮತ್ತು ರಕ್ಷಣೆಗೆ ನಾನು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇನೆ. ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?`,
    mismatch: (plant, expected, disease) => `ನಮಸ್ಕಾರ! 🌱 ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಚಿತ್ರವು **${plant}** ಆಗಿದೆ (ನೋಂದಾಯಿತ ಬೆಳೆ **${expected}**), ಇದರಲ್ಲಿ **${disease || 'ಸಮಸ್ಯೆ'}** ರೋಗ ಲಕ್ಷಣಗಳಿವೆ. ಇದರ ಬಗ್ಗೆ ನೀವು ಏನು ಕೇಳಲು ಬಯಸುತ್ತೀರಿ?`,
    general: (name) => `ನಮಸ್ಕಾರ ${name ? name + '! ' : ''}🌱 ನಾನು ಕೃಷಿ-ಬಾಟ್, ನಿಮ್ಮ ಬೆಳೆ ಆರೋಗ್ಯ ಸಹಾಯಕ. ರೋಗಗಳು, ರಸಗೊಬ್ಬರ, ಕೀಟ ನಿಯಂತ್ರಣ ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ! ಫೋಟೋ ಕೂಡ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.`,
  },
}

const LOCALIZED_SUGGESTIONS = {
  'en-IN': {
    disease: (crop, disease) => [
      `What are symptoms of ${disease} in ${crop}?`,
      `Recommended fungicide or organic control for ${disease}?`,
      `How quickly can this spread to other plants?`,
      `Can I prevent this organically?`,
    ],
    general: [
      'Best fertilizer for tomato flowering stage?',
      'How to treat early blight organically?',
      'Signs of nitrogen deficiency in leaves?',
      'When to harvest tomatoes?',
    ]
  },
  'hi-IN': {
    disease: (crop, disease) => [
      `${crop} में ${disease} के मुख्य लक्षण क्या हैं?`,
      `${disease} के लिए जैविक या रासायनिक नियंत्रण?`,
      `यह रोग कितनी तेजी से फैलता है?`,
      `क्या इसे जैविक रूप से रोका जा सकता है?`,
    ],
    general: [
      'टमाटर में फूल आने की अवस्था में उत्तम खाद?',
      'झुलसा रोग का जैविक उपचार कैसे करें?',
      'पत्तियों में नाइट्रोजन की कमी के लक्षण?',
      'टमाटर की सही तुड़ाई का समय?',
    ]
  },
  'mr-IN': {
    disease: (crop, disease) => [
      `${crop} पिकावर ${disease} ची मुख्य लक्षणे काय?`,
      `${disease} साठी सेंद्रिय किंवा रासायनिक उपाय?`,
      `हा रोग इतर झाडांवर किती वेगाने पसरतो?`,
      `सेंद्रिय पद्धतीने हा रोग कसा थांबवावा?`,
    ],
    general: [
      'टोमॅटो फुलोरा अवस्थेत कोणते खत द्यावे?',
      'करपा रोगावर सेंद्रिय नियंत्रण कसे करावे?',
      'नायट्रोजनच्या कमतरतेची लक्षणे कोणती?',
      'टोमॅटोची तोडणी कधी करावी?',
    ]
  },
  'ta-IN': {
    disease: (crop, disease) => [
      `${crop} பயிரில் ${disease} அறிகுறிகள் என்ன?`,
      `${disease} நோய்க்கான இயற்கை சிகிச்சை என்ன?`,
      `இது மற்ற பயிர்களுக்கு எவ்வாறு பரவுகிறது?`,
      `இயற்கை முறையில் கட்டுப்படுத்துவது எப்படி?`,
    ],
    general: [
      'தக்காளி பூக்கும் பருவத்திற்கான சிறந்த உரம்?',
      'இலைக்கருகல் நோய்க்கான இயற்கை தீர்வு?',
      'தழைச்சத்து குறைபாட்டின் அறிகுறிகள் என்ன?',
      'தக்காளி அறுவடை செய்வது எப்போது?',
    ]
  },
  'te-IN': {
    disease: (crop, disease) => [
      `${crop} లో ${disease} ముఖ్య లక్షణాలు ఏమిటి?`,
      `${disease} నివారణకు సేంద్రీయ లేదా రసాయన మందులు?`,
      `ఈ వ్యాధి ఇతర మొక్కలకు ఎంత వేగంగా వ్యాపిస్తుంది?`,
      `సేంద్రీయ పద్ధతిలో దీనిని నివారించవచ్చా?`,
    ],
    general: [
      'టమోటా పూత దశలో ఏ ఎరువు వాడాలి?',
      'ఆకు మాడు తెగులుకు సేంద్రీయ నివారణ?',
      'నత్రజని లోపం లక్షణాలు ఏమిటి?',
      'టమోటా కోత ఎప్పుడు చేయాలి?',
    ]
  },
  'kn-IN': {
    disease: (crop, disease) => [
      `${crop} ಬೆಳೆಯಲ್ಲಿ ${disease} ಮುಖ್ಯ ಲಕ್ಷಣಗಳೇನು?`,
      `${disease} ಗೆ ಸಾವಯವ ಅಥವಾ ರಾಸಾಯನಿಕ ಮದ್ದುಗಳೇನು?`,
      `ಈ ರೋಗ ಇತರ ಗಿಡಗಳಿಗೆ ಎಷ್ಟು ಬೇಗ ಹರಡುತ್ತದೆ?`,
      `ಸಾವಯವ ವಿಧಾನದಿಂದ ಇದನ್ನು ನಿಯಂತ್ರಿಸಬಹುದೇ?`,
    ],
    general: [
      'ಟೊಮೇಟೊ ಹೂಬಿಡುವ ಹಂತದಲ್ಲಿ ಯಾವ ಗೊಬ್ಬರ ಉತ್ತಮ?',
      'ಮುಂಗಾರು ಅಂಗಮಾರಿ ರೋಗಕ್ಕೆ ಸಾವಯವ ಚಿಕಿತ್ಸೆ ಏನು?',
      'ಸಾರಜನಕದ ಕೊರತೆಯ ಲಕ್ಷಣಗಳೇನು?',
      'ಟೊಮೇಟೊ ಕಟಾವು ಯಾವಾಗ ಮಾಡಬೇಕು?',
    ]
  }
}

const DEFAULT_IMAGE_CAPTIONS = {
  'en-IN': 'Please inspect this crop leaf image and diagnose any visible disease or issues.',
  'hi-IN': 'कृपया इस फसल/पत्ती के फोटो की जांच करें और किसी भी रोग या समस्या का निदान करें।',
  'mr-IN': 'कृपया या पिकाच्या/पानाच्या फोटोचे निरीक्षण करून रोग किंवा समस्या सांगा.',
  'ta-IN': 'தயவுசெய்து இந்த பயிர் இலை படத்தை ஆய்வு செய்து பாதிப்பை விளக்குங்கள்.',
  'te-IN': 'దయచేసి ఈ పంట ఆకు చిత్రాన్ని పరిశీలించి వ్యాధి లేదా సమస్యను వివరించండి.',
  'kn-IN': 'ದಯವಿಟ್ಟು ಈ ಬೆಳೆ ಎಲೆಯ ಚಿತ್ರವನ್ನು ಪರಿಶೀಲಿಸಿ ರೋಗ ಅಥವಾ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.',
}

export default function AssistantPage() {
  const locationState = useLocation().state
  const { activeFarm, user } = useAuth()
  const [language, setLanguage] = useState(user?.language || 'en-IN')

  const getDiseaseContext = () => {
    if (locationState?.disease || locationState?.plant_identified) return locationState
    return null
  }
  const diseaseCtx = getDiseaseContext()

  const generateGreeting = (langCode) => {
    const lang = INITIAL_GREETINGS[langCode] || INITIAL_GREETINGS['en-IN']
    const userName = user?.name?.split(' ')[0] || ''
    const cropName = diseaseCtx?.plant_identified || diseaseCtx?.crop || activeFarm?.crop || 'crop'
    const expectedCrop = diseaseCtx?.expected_crop || activeFarm?.crop || 'crop'

    if (diseaseCtx) {
      if (diseaseCtx.crop_match === false && diseaseCtx.plant_identified) {
        return lang.mismatch(diseaseCtx.plant_identified, expectedCrop, diseaseCtx.disease)
      }
      return lang.disease(cropName, diseaseCtx.disease || 'Crop Inquiry')
    }
    return lang.general(userName)
  }

  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: generateGreeting(user?.language || 'en-IN') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [attachedImage, setAttachedImage] = useState(null) // { file, previewUrl, base64 }

  const bottomRef = useRef()
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  // React to route state changes (when arriving from scanner)
  useEffect(() => {
    if (locationState?.disease || locationState?.plant_identified) {
      setMessages([{ role: 'assistant', content: generateGreeting(language) }])
    }
  }, [locationState])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Language switcher handler: immediately updates initial message / greeting in selected language
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    setMessages(prev => {
      if (prev.length === 0) return [{ role: 'assistant', content: generateGreeting(newLang) }]
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: generateGreeting(newLang) }]
      }
      // If messages already started, also localize the root greeting
      if (prev[0].role === 'assistant') {
        const updated = [...prev]
        updated[0] = { ...updated[0], content: generateGreeting(newLang) }
        return updated
      }
      return prev
    })
  }

  function handleImageFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAttachedImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: reader.result,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function speak(text) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*#`_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
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
    const text = userText?.trim()
    const currentImg = attachedImage

    if ((!text && !currentImg) || loading) return

    const messageText = text || (DEFAULT_IMAGE_CAPTIONS[language] || DEFAULT_IMAGE_CAPTIONS['en-IN'])
    const userMessage = {
      role: 'user',
      content: messageText,
      image: currentImg?.previewUrl || null,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setAttachedImage(null)
    setLoading(true)

    try {
      const response = await fetch(`${API}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          image: currentImg?.base64 || null,
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
      sendMessage(input)
    }
  }

  const plantName = diseaseCtx?.plant_identified || diseaseCtx?.crop || activeFarm?.crop || 'crop'
  const langSuggestionsObj = LOCALIZED_SUGGESTIONS[language] || LOCALIZED_SUGGESTIONS['en-IN']
  const suggestionsList = diseaseCtx
    ? langSuggestionsObj.disease(plantName, diseaseCtx.disease || 'this condition')
    : langSuggestionsObj.general

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-forest-700 flex items-center justify-center text-2xl shadow-md">🤖</div>
          <div>
            <h1 className="text-lg font-bold text-charcoal-800">Crop Health Assistant</h1>
            <p className="text-xs text-charcoal-400">Powered by Google Gemini · Multilingual Voice & Vision Support</p>
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
        <span className="text-xs text-charcoal-400 font-medium">Language:</span>
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLanguageChange(code)}
            className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
              language === code
                ? 'bg-forest-700 text-white border-forest-700 shadow-sm'
                : 'bg-white text-charcoal-600 border-earth-200 hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card overflow-hidden shadow-sm border border-earth-200">
        <div className="h-[420px] overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 animate-fade-in`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-forest-700 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">🤖</div>
              )}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'bubble-user' : 'bubble-bot'
              }`}>
                {/* Uploaded image thumbnail if present */}
                {msg.image && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 shadow-sm max-w-[240px]">
                    <img
                      src={msg.image}
                      alt="Uploaded crop leaf"
                      className="w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                      onClick={() => window.open(msg.image, '_blank')}
                      title="Click to view full image"
                    />
                  </div>
                )}

                {/* Render formatted message content */}
                <div
                  className="prose prose-sm max-w-none text-inherit leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />

                {msg.role === 'assistant' && i > 0 && (
                  <button
                    type="button"
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
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                  <span className="text-xs text-charcoal-400 ml-2">KrishiBot is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestionsList.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-sage-50 border border-sage-200 text-sage-700 px-3 py-1.5 rounded-full hover:bg-sage-100 transition shadow-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Attached image preview bar before sending */}
        {attachedImage && (
          <div className="px-4 py-2.5 bg-earth-50 border-t border-earth-200 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={attachedImage.previewUrl}
                alt="Upload preview"
                className="w-12 h-12 object-cover rounded-xl border border-earth-300 shadow-sm flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-charcoal-800 truncate">{attachedImage.file.name}</p>
                <p className="text-[10px] text-charcoal-400">
                  {(attachedImage.file.size / 1024).toFixed(1)} KB · Photo ready for Gemini AI analysis
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center text-xs font-bold transition flex-shrink-0"
              title="Remove image"
            >
              ✕
            </button>
          </div>
        )}

        {/* Speaking indicator */}
        {speaking && (
          <div className="px-5 py-2 flex items-center gap-2 border-t border-earth-100 bg-earth-50/50">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 bg-forest-500 rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
            <span className="text-xs text-forest-600 font-medium">Speaking in {LANGUAGE_NAMES[language]}...</span>
            <button type="button" onClick={stopSpeaking} className="text-xs text-red-400 hover:text-red-600 ml-auto font-medium">Stop</button>
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-earth-100 p-4 flex gap-2 items-end bg-white">
          {/* Hidden file input for uploading images */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileSelect}
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Upload crop or leaf photo"
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
              attachedImage
                ? 'bg-forest-100 text-forest-700 border-2 border-forest-500 shadow-sm'
                : 'bg-earth-100 text-charcoal-600 hover:bg-earth-200 hover:text-forest-700'
            }`}
          >
            📷
          </button>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              attachedImage
                ? `Ask about this photo in ${LANGUAGE_NAMES[language]} (or press Send)...`
                : `Ask in ${LANGUAGE_NAMES[language]}...`
            }
            rows={1}
            className="flex-1 resize-none bg-earth-50 border border-earth-200 rounded-xl px-4 py-2.5 text-sm text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:border-forest-400 focus:bg-white transition"
          />

          {/* Mic voice input button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={loading}
            title={recording ? 'Click to stop listening' : 'Click to speak'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
              recording ? 'bg-red-500 text-white animate-pulse' : 'bg-earth-100 text-charcoal-600 hover:bg-earth-200'
            }`}
          >
            {recording ? '⏹' : '🎙️'}
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !attachedImage) || loading}
            className="h-10 px-5 bg-forest-700 text-white rounded-xl text-sm font-semibold hover:bg-forest-600 disabled:opacity-40 transition flex-shrink-0 shadow-sm"
          >
            Send
          </button>
        </div>
      </div>

      <p className="text-xs text-charcoal-400 text-center">
        📷 Upload photos · 🎙️ Tap mic to speak · 🔊 Tap Read aloud · Responds in {LANGUAGE_NAMES[language]}
      </p>
    </div>
  )
}
