import { useState } from 'react';
import { useMockData } from '../../context/MockData';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, LayoutGrid, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const rolesToConfigure = ['superadmin', 'hr']; // High-level roles only

const DashboardConfig = () => {
  const { user } = useAuth();
  const { dashboardConfig, dashboardCards, setDashboardConfigForRole } = useMockData();
  const { showToast } = useToast();
  const [localConfig, setLocalConfig] = useState(dashboardConfig);

  if (user.role !== 'superadmin') {
    return (
      <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-600">Only superadmin can configure dashboard cards.</p>
      </div>
    );
  }

  const toggleCard = (role, cardId) => {
    const current = localConfig[role] || [];
    const exists = current.includes(cardId);
    const updated = exists ? current.filter(c => c !== cardId) : [...current, cardId];
    setLocalConfig({ ...localConfig, [role]: updated });
  };

  const handleSave = () => {
    Object.entries(localConfig).forEach(([role, cards]) => {
      setDashboardConfigForRole(role, cards);
    });
    showToast('success', 'Dashboard configuration saved.', { title: 'Saved' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center"><LayoutGrid className="mr-2 text-blue-600" /> Dashboard Card Configuration</h1>
        <p className="text-slate-500 mt-1">Assign which summary cards appear for each role.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rolesToConfigure.map(role => (
          <div key={role} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 capitalize mb-4">{role} View</h2>
            <div className="space-y-3">
              {dashboardCards.map(card => {
                const active = (localConfig[role] || []).includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(role, card.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors text-left ${
                      active ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span className="font-medium text-slate-700">{card.title}</span>
                    {active && <CheckSquare className="text-blue-600" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-colors shadow-lg shadow-blue-600/30 font-semibold"
        >
          <Save size={20} className="mr-2" /> Save Configuration
        </button>
      </div>
    </div>
  );
};

export default DashboardConfig;
