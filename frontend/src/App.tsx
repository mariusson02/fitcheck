import SegmentPreview from './components/SegmentPreview'
import ImageUploader from './components/ImageUploader'
import logo from './assets/logo.png'

function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <img src={logo} alt="FitCheck logo" className="app-logo" />
          <span className="app-title">FitCheck</span>
        </div>
        <div className="app-header-right">Preview & Analyze</div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <section className="app-card">
            <div className="app-grid">
              <div className="app-column">
                <h2>Upload</h2>
                <ImageUploader />
              </div>

              <div className="app-column">
                <h2>Segment & Preview</h2>
                <SegmentPreview />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App
