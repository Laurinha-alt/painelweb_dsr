import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Map as MapIcon, 
  Download, 
  Search, 
  Menu, 
  X, 
  Database, 
  Filter
} from 'lucide-react';

 import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
 import 'leaflet/dist/leaflet.css'; 

// --- Componente 1: Painel BI (Com Iframe Real) ---
const BIDashboard = () => {
  const [isExporting, setIsExporting] = useState(false);

  const powerBiUrl = "https://app.powerbi.com/view?r=eyJrIjoiMTQzODQzMjUtNDkyMS00MDllLWI5MzktOWY4ZDdlZjk3MGM2IiwidCI6IjFmMWJlODA0LWViZGYtNDJmNC1iZGExLTdmMjlhYmU2ZDQ3YSJ9"; 

  const handleExport = () => {
    setIsExporting(true);
    // Simulação de exportação
    const dados = [{ data: "2025-01", valor: 100 }, { data: "2025-02", valor: 200 }];
    
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8," + "Data,Valor\n" + dados.map(e => `${e.data},${e.valor}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "dados_bi.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      alert("Arquivo CSV baixado com sucesso!");
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Painel de Indicadores</h2>
          <p className="text-sm text-gray-500">Visualização Integrada Power BI</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download size={16} /> {isExporting ? 'Baixando...' : 'Baixar Dados (CSV)'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        <iframe 
          title="Relatorio Power BI"
          width="100%" 
          height="100%" 
          src={powerBiUrl} 
          frameBorder="0" 
          allowFullScreen={true}
          className="absolute inset-0"
        ></iframe>
      </div>
    </div>
  );
};

const MapUpdater = ({ coords }) => {
  const map = useMap();
  map.setView([coords.lat, coords.lng], 15); 
  return null;
};

// --- Componente 2: Mapa GIS ---
const GISMap = () => {
  const [coords, setCoords] = useState({ lat: -15.7975, lng: -47.8919 });
  const [geoJsonData, setGeoJsonData] = useState(null);

  useEffect(() => {
    fetch('/meu_mapa.json') 
      .then(response => {
        if(response.ok) return response.json();
      })
      .then(data => setGeoJsonData(data))
      .catch(err => console.log("Arquivo de mapa não encontrado na pasta public."));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Buscando: ${coords.lat}, ${coords.lng} (Ative o Leaflet no código para ver o zoom)`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm border-b z-10 flex gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded text-blue-600"><MapIcon size={20} /></div>
          <h2 className="font-bold text-gray-800">Mapa QGIS</h2>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input className="border p-1.5 rounded text-sm w-24" placeholder="Lat" value={coords.lat} onChange={e => setCoords({...coords, lat: e.target.value})}/>
          <input className="border p-1.5 rounded text-sm w-24" placeholder="Lng" value={coords.lng} onChange={e => setCoords({...coords, lng: e.target.value})}/>
          <button type="submit" className="bg-blue-600 text-white p-1.5 rounded"><Search size={16}/></button>
        </form>
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer center={[coords.lat, coords.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri'
          />
          {geoJsonData && <GeoJSON data={geoJsonData} style={{ color: '#fbbf24', weight: 3, opacity: 0.8 }} />}
          <MapUpdater coords={coords} />
        </MapContainer>
      </div>
    </div>
  );

};

// --- Estrutura Principal (Menu Lateral) ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col shadow-xl z-20`}>
        <div className="p-4 flex justify-between items-center border-b border-slate-700 h-16">
          {isSidebarOpen && <span className="font-bold tracking-wider text-blue-400">PAINEL DSR</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hover:bg-slate-700 p-1 rounded"><Menu size={20}/></button>
        </div>
        <nav className="flex-1 p-3 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <BarChart3 size={20} /> {isSidebarOpen && "Painel BI"}
          </button>
          <button 
            onClick={() => setActiveTab('map')} 
            className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${activeTab === 'map' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <MapIcon size={20} /> {isSidebarOpen && "Mapa GIS"}
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col w-full h-full relative">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' ? <BIDashboard /> : <GISMap />}
        </div>
      </main>
    </div>
  ); 
}