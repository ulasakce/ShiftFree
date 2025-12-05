import React from 'react';
import { EmployeeApp } from './views/EmployeeApp';
import { ManagerApp } from './views/ManagerApp';
import { LoginView } from './views/LoginView';
import { Role } from './types';
import { DataProvider, useData } from './context/DataContext';

const Main: React.FC = () => {
  const { currentUser } = useData();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen text-slate-800 relative bg-[#f8fafc]">
      {currentUser.role === Role.EMPLOYEE ? <EmployeeApp /> : <ManagerApp />}
      
      {/* Global decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-100 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <Main />
    </DataProvider>
  );
};

export default App;