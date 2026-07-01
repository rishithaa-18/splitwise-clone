import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GroupList from './pages/GroupList';
import GroupDetail from './pages/GroupDetail';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/groups" element={<GroupList />} />
          <Route path="/groups/:groupId" element={<GroupDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/groups" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;