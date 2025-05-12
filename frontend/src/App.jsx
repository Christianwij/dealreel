import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import './App.css'

// Set your Render backend URL here
const BACKEND_URL = 'https://dealreel-backend.onrender.com'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setError(null)
      setVideoUrl(null)
      setDebugInfo(null)
    } else {
      alert('Please select a PDF file')
      event.target.value = null
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsLoading(true)
    setError(null)
    setVideoUrl(null)
    setDebugInfo(null)
    setProcessing(true)
    
    const formData = new FormData()
    formData.append('file', selectedFile)
    
    try {
      console.log('Sending request to:', `${BACKEND_URL}/api/upload`)
      
      const response = await axios.post(`${BACKEND_URL}/api/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
      })
      
      console.log('Response:', response.data)
      
      // If backend returns a video URL, construct the full URL and show it
      if (response.data.videoUrl) {
        const fullVideoUrl = `${BACKEND_URL}${response.data.videoUrl}`
        console.log('Video URL:', fullVideoUrl)
        setVideoUrl(fullVideoUrl)
      } else {
        setVideoUrl(null)
        setError('No video URL returned from server')
      }
    } catch (err) {
      console.error('Upload error:', err)
      
      const errorMessage = err.response?.data?.error || 'Error uploading file'
      const stackTrace = err.response?.data?.stack || ''
      
      setError(errorMessage)
      setDebugInfo(
        `Status: ${err.response?.status || 'unknown'}\n` +
        `Message: ${errorMessage}\n` +
        `Stack: ${stackTrace}`
      )
    } finally {
      setIsLoading(false)
      setProcessing(false)
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
        {error && (
          <p className="error">{error}</p>
        )}
        {debugInfo && (
          <pre className="debug-info" style={{whiteSpace: 'pre-wrap', textAlign: 'left', backgroundColor: '#f6f8fa', padding: '1rem', fontSize: '12px'}}>
            {debugInfo}
          </pre>
        )}
        {videoUrl ? (
          <div className="video-player-container">
            <h2>Your Pitch Video</h2>
            <video controls width="100%" style={{ maxWidth: 800 }} src={videoUrl} />
            <a href={videoUrl} download className="download-link">Download Video</a>
          </div>
        ) : processing && (
          <div style={{ margin: '2rem 0', color: '#555', fontWeight: 'bold' }}>
            Your video is being prepared. Check back soon!
          </div>
        )}
      </div>
    </div>
  )
}

export default App 