import {Routes, Route} from 'react-router-dom'
import Homepage from './pages/Home';
import { SocketProvider } from './providers/Sockets';
import RoomPage from './pages/Room';

function App() {
  return (
    <SocketProvider>
      <Routes>
      <Route path="/" element ={<Homepage />} />
      <Route path="/room/:roomId" element = {<RoomPage />} />
      </Routes>
    </SocketProvider>
  )
}

export default App
