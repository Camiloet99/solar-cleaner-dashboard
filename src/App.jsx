import { React } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import SessionDashboard from "./pages/SessionDashboard";
import Header from "./components/Header";

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomeWrapper />} />
        <Route path="/session/:sessionId" element={<SessionDashboard />} />
      </Routes>
    </Router>
  );
};

const HomeWrapper = () => {
  const navigate = useNavigate();

  const handleSelectSession = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  return <HomePage onSelectSession={handleSelectSession} />;
};

export default App;
