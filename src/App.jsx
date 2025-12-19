import React, { useState, useEffect, useRef } from 'react';
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

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correção dos ícones do marcador
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Painel BI 
const BIDashboard = () => {
  const [isExporting, setIsExporting] = useState(false);

  // Link do Power BI
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
      alert("Download concluído com sucesso!");
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Painel de Indicadores</h2>
          <p className="text-sm text-gray-500">Ministério das Cidades - DSR</p>
        </div>
        {/* Botão de Download EM MANUTENÇÃO
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
        */}

        {/* Avisode funcionalidade futura  */}
        <div className="text-xs text-gray-400 italic border border-gray-200 px-3 py-1 rounded-full">
            Exportação de dados em breve
        </div>

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


// Mapa GIS (Alta Resolução Google)
const GISMap = () => {
  const mapContainerRef = useRef(null); 
  const mapInstanceRef = useRef(null);
  
  // Inicia na Rodoviária- Brasília
  const [coords, setCoords] = useState({ lat: -15.7934, lng: -47.8823 });

  useEffect(() => {
    // Inicialização Única do Mapa
    if (!mapInstanceRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 15);
      
      // CAMADA GOOGLE HYBRID 
      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20 // Permite zoom muito próximo para ver casas/fazendas
      }).addTo(map);

      // Carrega os dados do QGIS (se existirem)
      fetch('/meu_mapa.json')
        .then(res => { if(res.ok) return res.json(); })
        .then(data => {
          if (data) {
            L.geoJSON(data, {
              style: { color: '#fbbf24', weight: 3, opacity: 0.8 }
            }).addTo(map);
          }
        })
        .catch(err => console.log("Camada não carregada."));

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (mapInstanceRef.current) {
      const lat = parseFloat(coords.lat);
      const lng = parseFloat(coords.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        // Adiciona um marcador no local pesquisado para fácil identificação
        L.marker([lat, lng]).addTo(mapInstanceRef.current)
          .bindPopup(`<b>Ponto de Análise</b><br>Lat: ${lat}<br>Lng: ${lng}`)
          .openPopup();

        // ZOOM NÍVEL 18: Extremamente próximo para ver detalhes
        mapInstanceRef.current.setView([lat, lng], 18); 
      } else {
        alert("Coordenadas inválidas. Use formato decimal (ex: -15.7934)");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm border-b z-10 flex gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded text-blue-600"><MapIcon size={20} /></div>
          <div>
            <h2 className="font-bold text-gray-800">Analizador Geoespacial</h2>
            <p className="text-xs text-gray-500">Satélite Google Hybrid</p>
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 bg-gray-100 p-1 rounded border border-gray-200">
          <input 
            className="bg-transparent p-1.5 text-sm w-28 outline-none border-r border-gray-300" 
            placeholder="Latitude" 
            value={coords.lat} 
            onChange={e => setCoords({...coords, lat: e.target.value})}
          />
          <input 
            className="bg-transparent p-1.5 text-sm w-28 outline-none" 
            placeholder="Longitude" 
            value={coords.lng} 
            onChange={e => setCoords({...coords, lng: e.target.value})}
          />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-medium text-sm flex items-center gap-1">
            <Search size={14}/> Ir
          </button>
        </form>
      </div>

      <div className="flex-1 relative z-0 h-full min-h-[500px]">
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

// --- Estrutura Principal ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col shadow-xl z-20`}>
        <div className="p-4 flex justify-between items-center border-b border-slate-700 h-16">
          {isSidebarOpen && <span className="font-bold tracking-wider text-blue-400">MCID PORTAL</span>}
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
        <div className="flex-1 overflow-hidden h-full">
          {activeTab === 'dashboard' ? <BIDashboard /> : <GISMap />}
        </div>
      </main>
    </div>
  );
}