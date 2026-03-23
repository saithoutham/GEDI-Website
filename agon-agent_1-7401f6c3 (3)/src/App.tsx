import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './AppShell';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Topic from './pages/Topic';
import About from './pages/About';
import Eligibility from './pages/Eligibility';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/eligibility" element={<Eligibility />} />
          <Route path="/topic/:topic" element={<Topic />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
