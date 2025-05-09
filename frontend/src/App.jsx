import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [script, setScript] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setHeaders([])
      setScript([])
      setError(null)
    } else {
      alert('Please select a PDF file')
      event.target.value = null
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setHeaders(response.data.headers)
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
      const response = await axios.post('http://localhost:5000/api/generate-script', {
        headers: headers
      })
      setScript(response.data.script)
    } catch (err) {
      setError(err.response?.data?.error || 'Error generating script')
    } finally {
      setIsGeneratingScript(false)
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
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App 