import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import './App.css'

// Set your Render backend URL here
const BACKEND_URL = 'https://dealreel-backend.onrender.com'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [script, setScript] = useState([])
  const [audioSections, setAudioSections] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [error, setError] = useState(null)
  const [textPreview, setTextPreview] = useState('')
  const [summary, setSummary] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setHeaders([])
      setScript([])
      setError(null)
      setTextPreview('')
      setSummary(null)
    } else {
      alert('Please select a PDF file')
      event.target.value = null
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)
    setTextPreview('')
    setSummary(null)
    setHeaders([])
    setScript([])
    setAudioSections([])
    setVideoUrl(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setHeaders(response.data.headers || [])
      setTextPreview(response.data.text ? response.data.text.substring(0, 1000) : '')
      setSummary(response.data.summary || null)
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateScript = async () => {
    if (headers.length === 0) return

    setIsGeneratingScript(true)
    setError(null)

    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate-script`, {
        headers: headers
      })
      setScript(response.data.script)
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating script')
    } finally {
      setIsGeneratingScript(false)
    }
  }

  const handleGenerateAudio = async () => {
    if (script.length === 0) return

    setIsGeneratingAudio(true)
    setError(null)

    try {
      const response = await axios.post(`${BACKEND_URL}/api/text-to-speech`, {
        script: script
      })
      setAudioSections(response.data.audioSections)
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating audio')
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (script.length === 0 || audioSections.length === 0) return
    setIsGeneratingVideo(true)
    setError(null)
    setVideoUrl(null)
    try {
      // Prepare sections for backend: title, text, audio (base64)
      const sections = script.map((section, i) => ({
        title: section.title,
        text: section.text,
        audio: audioSections[i]?.audio
      }))
      const response = await axios.post(`${BACKEND_URL}/api/generate-video`, { sections })
      setVideoUrl(`${BACKEND_URL}${response.data.video}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating video')
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  return (
    <div className="app">
      <h1>DealReel</h1>
      <div className="upload-container">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        {selectedFile && (
          <>
            <p className="file-name">Selected file: {selectedFile.name}</p>
            <button 
              onClick={handleUpload}
              disabled={isLoading}
              className="upload-button"
            >
              {isLoading ? 'Processing...' : 'Upload and Parse'}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
        {headers.length > 0 && (
          <>
            <div className="headers-container">
              <h2>Extracted Headers</h2>
              <ul className="headers-list">
                {headers.map((header, index) => (
                  <li key={index}>{header}</li>
                ))}
              </ul>
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="generate-button"
              >
                {isGeneratingScript ? 'Generating Script...' : 'Generate Script'}
              </button>
            </div>
            {script.length > 0 && (
              <div className="script-container">
                <h2>Generated Script</h2>
                {script.map((section, index) => (
                  <div key={index} className="script-section">
                    <h3>{section.title}</h3>
                    <p>{section.text}</p>
                    {audioSections[index] && (
                      <div className="audio-player">
                        <audio controls src={audioSections[index].audio}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                ))}
                {!isGeneratingAudio && audioSections.length === 0 && (
                  <button
                    onClick={handleGenerateAudio}
                    className="generate-button"
                  >
                    Generate Audio
                  </button>
                )}
                {isGeneratingAudio && (
                  <p className="loading">Generating audio... This may take a few moments.</p>
                )}
              </div>
            )}
          </>
        )}
        {(headers.length === 0 && textPreview) && (
          <div className="text-preview-container">
            <h2>Extracted Text Preview</h2>
            <pre className="text-preview">{textPreview}</pre>
            {summary ? (
              <div className="summary-container">
                <h2>AI Summary</h2>
                <p>{summary}</p>
              </div>
            ) : (
              <div className="summary-container">
                <h2>AI Summary</h2>
                <p style={{ color: '#d32f2f' }}>No summary available. You can still use the extracted text above.</p>
              </div>
            )}
          </div>
        )}
        {audioSections.length > 0 && (
          <div className="video-gen-container">
            <button
              onClick={handleGenerateVideo}
              className="generate-button"
              disabled={isGeneratingVideo}
            >
              {isGeneratingVideo ? 'Generating Video...' : 'Generate Video'}
            </button>
            {videoUrl && (
              <div className="video-player-container">
                <h2>Generated Video</h2>
                <video controls width="100%" style={{ maxWidth: 800 }} src={videoUrl} />
                <a href={videoUrl} download className="download-link">Download Video</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App 