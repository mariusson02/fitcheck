import { useState } from 'react'
import ImageUploader from './components/ImageUploader'

function App() {
  const [count, setCount] = useState(0)

  return (
    <ImageUploader />
  )
}

export default App
