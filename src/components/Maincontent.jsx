export default function MainContent({ children, collapsed }) {
  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${collapsed ? 'ml-16' : 'ml-64'}`}>
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Título de la página</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300">
              <i className="fas fa-bell"></i>
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <i className="fas fa-user"></i>
              </div>
              <span className="ml-2 text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}