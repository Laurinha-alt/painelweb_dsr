import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Map as MapIcon, 
  Menu, 
  Search,
  FileSpreadsheet,
  Globe,
  FilterX,
  Download
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const initialState = {
  uf: 'Todos', municipio: 'Todos', situacao_obra: 'Todos',
  n_instrumento: 'Todos', n_proposta: 'Todos', novo_pac: 'Todos',
  tipo_instrumento: 'Todos', componente: 'Todos', carteira_ativa: 'Todos',
  termino_vigencia: 'Todos', prazo_clausula: 'Todos'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [filtros, setFiltros] = useState(initialState);
  const [isDownloading, setIsDownloading] = useState(false);

  const getFilteredPowerBiUrl = () => {
    let baseUrl = "https://app.powerbi.com/view?r=eyJrIjoiYzkzZGJhZjctOGQ4Yy00YmNiLTkwYTYtMjg1ZjZlNDliNGJjIiwidCI6IjFmMWJlODA0LWViZGYtNDJmNC1iZGExLTdmMjlhYmU2ZDQ3YSJ9";
    let filterParts = [];
    if (filtros.uf !== 'Todos') filterParts.push(`Tabela/UF eq '${filtros.uf}'`);
    if (filtros.situacao_obra !== 'Todos') filterParts.push(`Tabela/Situacao eq '${filtros.situacao_obra}'`);
    return filterParts.length > 0 ? `${baseUrl}&filter=${filterParts.join(' and ')}` : baseUrl;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const params = new URLSearchParams(filtros);
    try {
      const response = await fetch(`http://localhost:3000/api/exportar-dados?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dados_Filtrados_MCID.csv`;
      a.click();
    } catch (error) {
      alert("Erro ao conectar ao servidor de banco de dados.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col z-20 shadow-2xl`}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center h-16 bg-slate-950">
          {isSidebarOpen && <span className="font-bold text-blue-400 flex items-center gap-2"><Globe size={18}/> MCID PORTAL</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hover:bg-slate-800 p-1 rounded"><Menu size={20}/></button>
        </div>
        <nav className="p-3 space-y-2 mt-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
            <BarChart3 size={20} /> {isSidebarOpen && "Painel BI"}
          </button>
          <button onClick={() => setActiveTab('map')} className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${activeTab === 'map' ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}>
            <MapIcon size={20} /> {isSidebarOpen && "Mapa GIS"}
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {activeTab === 'dashboard' && (
          <div className="bg-white border-b p-4 shadow-sm z-10">
            <div className="max-w-[1600px] mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                {Object.keys(filtros).map((key) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">{key.replace('_', ' ')}</label>
                    <select 
                      className="border rounded p-1.5 text-xs bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                      value={filtros[key]}
                      onChange={(e) => setFiltros({...filtros, [key]: e.target.value})}
                    >
                      <option value="Todos">Todos</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 border-t pt-3">
                <button onClick={() => setFiltros(initialState)} className="flex items-center gap-2 text-xs font-bold text-slate-500 px-4 py-2 hover:bg-gray-100 rounded">
                  <FilterX size={14}/> Limpar Filtros
                </button>
                <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 text-xs font-bold bg-emerald-600 text-white px-6 py-2 rounded shadow-md hover:bg-emerald-700">
                  <Download size={14}/> {isDownloading ? "Gerando..." : "Baixar Dados Filtrados"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' ? (
            <iframe title="Relatorio" width="100%" height="100%" src={getFilteredPowerBiUrl()} frameBorder="0" allowFullScreen={true} className="absolute inset-0"></iframe>
          ) : (
            <GISMap />
          )}
        </div>
      </main>
    </div>
  );
}

//Componente Mapa GIS 
const GISMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [searchCoords, setSearchCoords] = useState("");

  const inicioLat = -15.7873556;
  const inicioLng = -47.8793481;

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const satellite = L.tileLayer('http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['mt0','mt1','mt2','mt3'],
        attribution: '© Google Maps'
      });
      mapRef.current = L.map(mapContainerRef.current, {
        center: [inicioLat, inicioLng],
        zoom: 20
      ,
        layers: [satellite]
      });
      L.marker([inicioLat, inicioLng]).addTo(mapRef.current).bindPopup("MCID").openPopup();
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const handleSearch = () => {
    const partes = searchCoords.replace(',', ' ').split(/\s+/).filter(x => x !== "");
    const lat = parseFloat(partes[0]);
    const lng = parseFloat(partes[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.setView([lat, lng], 20);
      L.marker([lat, lng]).addTo(mapRef.current).bindPopup(`Local: ${lat}, ${lng}`).openPopup();
    } else {
      alert("Formato esperado: Latitude, Longitude");
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Barra de Busca Reativada sobre o Mapa */}
      <div className="absolute top-4 left-4 md:left-12 z-[1000] flex gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-2xl border border-gray-200">
        <input 
          type="text" 
          placeholder="Pesquisar Lat, Long" 
          className="text-sm p-2 w-64 outline-none bg-transparent"
          value={searchCoords}
          onChange={(e) => setSearchCoords(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-700">Ir</button>
      </div>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};