import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Resume from './pages/Resume';
import Setup from './pages/Setup';
import Inbox from './pages/Inbox';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/inbox" element={<Inbox />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
