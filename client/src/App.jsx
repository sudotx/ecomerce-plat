import './App.css'

function App() {
  return (
    <main className="app">
      <h1>Ecommerce Platform</h1>
      <p>
        Frontend shell ready. API runs at{' '}
        <code>{import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}</code>.
      </p>
    </main>
  )
}

export default App