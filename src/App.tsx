import './App.css'
import { CanvasApp } from './components/CanvasApp'
import { DebugOverlay } from './components/DebugOverlay'

function App() {
  return (
    <div className="app">
      <CanvasApp />
      <DebugOverlay />
    </div>
  )
}

export default App