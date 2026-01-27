import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Map as MapIcon, Menu, Globe, 
  Loader2, Navigation, Search, Download 
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const coordenadasUFs = {
  "11": [-10.94, -62.82], "12": [-9.02, -70.81], "13": [-3.41, -64.59], "14": [1.81, -61.34],
  "15": [-3.79, -52.48], "16": [1.41, -51.77], "17": [-10.17, -48.33], "21": [-4.96, -45.27],
  "22": [-7.71, -42.71], "23": [-5.49, -39.32], "24": [-5.41, -36.95], "25": [-7.24, -36.78],
  "26": [-8.81, -36.95], "27": [-9.57, -36.78], "28": [-10.57, -37.45], "29": [-12.57, -41.7],
  "31": [-18.51, -44.55], "32": [-19.19, -40.34], "33": [-22.38, -42.67], "35": [-22.26, -48.52],
  "41": [-24.89, -51.55], "42": [-27.24, -50.48], "43": [-30.03, -53.78], "50": [-20.77, -54.78],
  "51": [-12.68, -55.42], "52": [-15.82, -49.83], "53": [-15.78, -47.92]
};

export default function App() {
  // ÚNICA ALTERAÇÃO ADICIONADA: IP DINÂMICO
  const API_BASE = `http://${window.location.hostname}:3000`;

  const [activeTab, setActiveTab] = useState('map');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [filtros, setFiltros] = useState({ uf: 'Todos', municipio: 'Todos', nr_proposta: '' });
  const [listaUfs, setListaUfs] = useState([]);
  const [listaMunicipios, setListaMunicipios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCoords, setSearchCoords] = useState(""); 
  
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersLayerRef = useRef(L.layerGroup());

  const [camadas, setCamadas] = useState({ aglomerado: false, setores: false });
  const aglomeradoLayerRef = useRef(null);
  const setoresLayerRef = useRef(null);
  const [loadingCamada, setLoadingCamada] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/ufs`).then(r => r.json()).then(setListaUfs);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const gerenciar = (ativa, url, cor, ref) => {
      if (ativa) {
        if (!ref.current) {
          setLoadingCamada(true);
          fetch(url)
            .then(r => r.json())
            .then(data => {
              ref.current = L.geoJSON(data, { 
                style: { 
                  color: cor, 
                  weight: 1, 
                  fillOpacity: 0.1, 
                  smoothFactor: 2.0 
                } 
              });
              ref.current.addTo(mapRef.current);
              setLoadingCamada(false);
            })
            .catch(err => {
              console.error("Erro ao carregar camada:", err);
              setLoadingCamada(false);
            });
        } else {
          if (!mapRef.current.hasLayer(ref.current)) {
            ref.current.addTo(mapRef.current);
          }
        }
      } else if (ref.current) {
        mapRef.current.removeLayer(ref.current);
      }
    };

    gerenciar(camadas.aglomerado, '/aglomerado_rural.json', '#eab308', aglomeradoLayerRef);
    gerenciar(camadas.setores, '/setores_censitarios.json', '#3b82f6', setoresLayerRef);

  }, [camadas]);

  const fetchObras = async () => {
    if (!mapRef.current || activeTab !== 'map') return;
    setLoading(true);
    
    const bounds = mapRef.current.getBounds();

    const ufParaApi = filtros.uf !== 'Todos' 
      ? listaUfs.find(u => String(u.cod_uf) === String(filtros.uf))?.sigla_uf 
      : 'Todos';

    const query = new URLSearchParams({
      uf: ufParaApi, 
      municipio: filtros.municipio,
      nr_proposta: filtros.nr_proposta,
      minLat: bounds.getSouth(), maxLat: bounds.getNorth(),
      minLng: bounds.getWest(), maxLng: bounds.getEast()
    });

    try {
      const res = await fetch(`${API_BASE}/api/obras-mapa?${query}`);
      const obras = await res.json();
      markersLayerRef.current.clearLayers();
      
      obras.forEach(obra => {
        if (obra.Latitude && obra.Longitude) {
            const marker = L.marker([parseFloat(obra.Latitude), parseFloat(obra.Longitude)]);
            const f = (v) => (v && v !== "null") ? v : "---";
            const m = (v) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : "R$ 0,00";

            marker.bindPopup(`
              <div style="width:380px; font-family: sans-serif; margin: -1px; line-height: 1.4;">
                <div style="background:#1e293b; color:#60a5fa; padding: 12px; border-radius: 4px 4px 0 0; border-bottom: 3px solid #3b82f6;">
                  <b style="font-size:13px; text-transform:uppercase; display:block; line-height:1.2;">${f(obra["Nome da Obra"])}</b>
                </div>
                <div style="padding: 12px; font-size:11px; display:flex; flex-direction:column; gap:10px; color:#334155;">
                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div><b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Órgão Executor</b>${f(obra["Órgão executor"])}</div>
                    <div><b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Nr. Proposta</b>${f(obra.nr_proposta)}</div>
                  </div>
                  <div style="background:#f8fafc; padding:10px; border-radius:6px; border: 1px solid #e2e8f0; display:flex; flex-direction:column; gap:6px;">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                      <div><b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Valor Repasse</b>${m(obra["Valor Repasse"])}</div>
                      <div><b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Valor Empenho</b>${m(obra["Valor Empenho"])}</div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
                      <div><b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Valor Desembolsado</b>${m(obra["Valor Desembolsado"])}</div>
                      <div>
                        <b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Total Investimento</b>
                        <span style="font-weight:bold; color:#0f172a; font-size:11px;">${m(obra["Valor Total do Investimento"])}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <div>
                      <b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Fase do Instrumento</b>
                      <span style="color:#334155; font-weight:500; font-size:11px;">${f(obra["Fase do Instrumento"])}</span>
                    </div>
                    <div>
                      <b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Situação</b>
                      <span style="color:#334155; font-weight:500; font-size:11px;">${f(obra["situacao"])}</span>
                    </div>
                  </div>

                  <div>
                    <b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block; margin-bottom:3px;">Situação Atual</b>
                    <div style="color:#2563eb; font-weight:bold; background:#eff6ff; padding:6px 10px; border-radius:4px; border:1px solid #dbeafe; line-height:1.2; font-size:11px;">
                      ${f(obra["Situação Atual "])}
                    </div>
                  </div>
                  <div style="background:#f8fafc; padding:10px; border-radius:4px; border-left:3px solid #cbd5e1;">
                    <b style="color:#64748b; font-size:9px; text-transform:uppercase; display:block;">Objeto do Contrato</b>
                    <span style="color:#475569; line-height:1.3; display:block; font-size:10px;">${f(obra["Objeto do Contrato"])}</span>
                  </div>
                </div>
              </div>
            `, { padding: [0, 0], closeButton: false, maxWidth: 400 });

            marker.addTo(markersLayerRef.current);
            
            if (filtros.nr_proposta && String(obra.nr_proposta) === String(filtros.nr_proposta)) {
               marker.openPopup();
            }
        }
      });

      if (filtros.nr_proposta && obras.length > 0) {
        const principal = obras[0];
        mapRef.current.setView([parseFloat(principal.Latitude), parseFloat(principal.Longitude)], 18);
        const ufObj = listaUfs.find(u => u.sigla_uf === principal.sigla_uf);
        if (ufObj) {
            const codUfFound = String(ufObj.cod_uf);
            const munRes = await fetch(`${API_BASE}/api/municipios/${codUfFound}`);
            const munData = await munRes.json();
            setListaMunicipios(munData);
            setFiltros(prev => ({ 
                ...prev, 
                uf: codUfFound, 
                municipio: String(principal.cod_municipio) 
            }));
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { renderer: L.canvas() }).setView([-14.235, -51.925], 4);
      L.tileLayer('http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { 
        subdomains:['mt0','mt1','mt2','mt3'] 
      }).addTo(mapRef.current);
      markersLayerRef.current.addTo(mapRef.current);
      mapRef.current.on('moveend', fetchObras);
      fetchObras();
    }
  }, [activeTab]);

  const handleUfChange = (codUf) => {
    setFiltros({ ...filtros, uf: codUf, municipio: 'Todos' });
    if (codUf !== 'Todos' && coordenadasUFs[codUf]) {
      mapRef.current.setView(coordenadasUFs[codUf], 7);
      fetch(`${API_BASE}/api/municipios/${codUf}`).then(r => r.json()).then(setListaMunicipios);
    }
  };

  const handleMunicipioChange = (codMun) => {
    setFiltros(prev => ({ ...prev, municipio: codMun }));
    if (codMun !== 'Todos') {
      const mun = listaMunicipios.find(m => String(m.cod_municipio) === String(codMun));
      if (mun && mun.latitude && mun.longitude) {
        mapRef.current.setView([parseFloat(mun.latitude), parseFloat(mun.longitude)], 14);
      }
    }
  };

  const irParaCoordenada = async () => {
    const partes = searchCoords.split(/[\s,]+/).filter(x => x !== "");
    const lat = parseFloat(partes[0]); 
    const lng = parseFloat(partes[1]);

    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.setView([lat, lng], 19);

      try {
        const res = await fetch(`${API_BASE}/api/obra-por-coordenada?lat=${lat}&lng=${lng}`);
        const obra = await res.json();
        if (obra && obra.nr_proposta) {
          setFiltros({ ...filtros, nr_proposta: String(obra.nr_proposta) });
          setTimeout(() => fetchObras(), 300);
        }
      } catch (e) { 
        console.error("Erro na sincronização por coordenada:", e); 
      }
    }
  };

  const exportarDados = () => {
    if (!filtros.nr_proposta) {
      alert("Insira um número de proposta para exportar os dados.");
      return;
    }
    const propostaSegura = encodeURIComponent(filtros.nr_proposta);
    window.location.href = `${API_BASE}/api/exportar-obra?nr_proposta=${propostaSegura}`;
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all flex flex-col z-40 shadow-2xl`}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center h-16 bg-slate-950">
          {isSidebarOpen && <span className="font-bold text-blue-400 flex items-center gap-2"><Globe size={18}/> Painel MCID</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hover:bg-slate-800 p-1 rounded transition-colors"><Menu size={20}/></button>
        </div>
        <nav className="p-3 space-y-2 mt-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-4 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}><BarChart3 size={20}/> {isSidebarOpen && "Painel BI"}</button>
          <button onClick={() => setActiveTab('map')} className={`w-full flex items-center gap-3 p-4 rounded-xl ${activeTab === 'map' ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-400 hover:bg-slate-800'}`}><MapIcon size={20}/> {isSidebarOpen && "Mapa GIS"}</button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeTab === 'map' ? (
          <>
            <header className="h-20 bg-white border-b flex items-center px-6 gap-4 z-30 shadow-sm">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                <select className="text-xs border rounded p-2 w-28 bg-slate-50 outline-blue-500 shadow-sm" value={filtros.uf} onChange={(e) => handleUfChange(e.target.value)}>
                  <option value="Todos">Brasil</option>
                  {listaUfs.map(u => <option key={u.cod_uf} value={u.cod_uf}>{u.sigla_uf}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Município</label>
                <select className="text-xs border rounded p-2 w-44 bg-slate-50 outline-blue-500 shadow-sm" value={filtros.municipio} onChange={(e) => handleMunicipioChange(e.target.value)} disabled={filtros.uf === 'Todos'}>
                  <option value="Todos">Todos</option>
                  {listaMunicipios.map(m => <option key={m.cod_municipio} value={m.cod_municipio}>{m.nome_municipio}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nr. Proposta</label>
                <div className="flex gap-1">
                  <input type="text" value={filtros.nr_proposta} onChange={(e) => setFiltros({...filtros, nr_proposta: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && fetchObras()} placeholder="Pesquisar..." className="text-xs border rounded p-2 w-32 bg-slate-50 outline-blue-500 shadow-sm" />
                  <button onClick={fetchObras} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"><Search size={14}/></button>
                </div>
              </div>
              <div className="flex flex-col border-l pl-4 ml-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Camadas GIS</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1 cursor-pointer group">
                    <input type="checkbox" checked={camadas.aglomerado} onChange={e => setCamadas({...camadas, aglomerado: e.target.checked})} className="w-3.5 h-3.5 accent-yellow-500" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-yellow-600">Aglomerados Rurais</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer group">
                    <input type="checkbox" checked={camadas.setores} onChange={e => setCamadas({...camadas, setores: e.target.checked})} className="w-3.5 h-3.5 accent-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600">Setores Censitários</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col ml-auto">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pesquisar Coordenada</label>
                <div className="flex gap-1">
                  <input type="text" value={searchCoords} onChange={(e) => setSearchCoords(e.target.value)} placeholder="Lat, Long" className="text-xs border rounded p-2 w-44 outline-blue-500 shadow-sm" onKeyDown={(e) => e.key === 'Enter' && irParaCoordenada()} />
                  <button onClick={irParaCoordenada} className="bg-blue-600 text-white p-2 rounded shadow-sm hover:bg-blue-700"><Navigation size={14}/></button>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Exportar</label>
                <button onClick={exportarDados} className="bg-green-600 text-white p-2 rounded flex items-center gap-2 text-xs hover:bg-green-700 transition-colors">
                  <Download size={14}/> CSV
                </button>
              </div>
            </header>
            <main className="flex-1 relative bg-slate-100">
               {loading && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-white/95 px-6 py-2 rounded-full shadow-2xl text-xs font-bold text-blue-600 border border-blue-100 flex items-center gap-2">
                   <Loader2 className="animate-spin" size={14}/> Sincronizando obras...
                 </div>
               )}
               {loadingCamada && (
                 <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] bg-yellow-500/95 px-6 py-2 rounded-full shadow-2xl text-xs font-bold text-white flex items-center gap-2">
                   <Loader2 className="animate-spin" size={14}/> Processando camadas (isto pode demorar alguns segundos)...
                 </div>
               )}
               <div ref={mapContainerRef} className="h-full w-full" />
            </main>
          </>
        ) : (
          <main className="flex-1 relative">
            <iframe title="Painel BI" width="100%" height="100%" src="https://app.powerbi.com/view?r=eyJrIjoiMTQzODQzMjUtNDkyMS00MDllLWI5MzktOWY4ZDdlZjk3MGM2IiwidCI6IjFmMWJlODA0LWViZGYtNDJmNC1iZGExLTdmMjlhYmU2ZDQ3YSJ9" frameBorder="0" allowFullScreen className="absolute inset-0"></iframe>
          </main>
        )}
      </div>
    </div>
  );
}