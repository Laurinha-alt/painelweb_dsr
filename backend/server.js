import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';

const app = express();
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT),
});

app.get('/api/ufs', async (req, res) => {
  try {
    const query = `SELECT "cod_uf", "sigla_uf" FROM territorio.tb_uf ORDER BY "sigla_uf"`;
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/municipios/:cod_uf', async (req, res) => {
  try {
    const query = `SELECT "cod_municipio", "nome_municipio", "latitude", "longitude" FROM territorio.tb_municipio WHERE "cod_uf" = $1 ORDER BY "nome_municipio"`;
    const resultado = await pool.query(query, [req.params.cod_uf]);
    res.json(resultado.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/obra-por-coordenada', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const query = `
      SELECT "sigla_uf", "cod_municipio"::text, "nr_proposta"::text 
      FROM instrumento.vw_detalhamento_obras 
      WHERE ROUND("Latitude"::numeric, 4) = ROUND($1::numeric, 4) 
        AND ROUND("Longitude"::numeric, 4) = ROUND($2::numeric, 4) 
      LIMIT 1`;
    const resultado = await pool.query(query, [lat, lng]);
    res.json(resultado.rows[0] || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/obras-mapa', async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng, uf, municipio, nr_proposta } = req.query;
    let query = `SELECT * FROM instrumento.vw_detalhamento_obras WHERE "Latitude" IS NOT NULL`;
    let params = [];
    let count = 1;

    if (nr_proposta && nr_proposta.trim() !== "") {
      query += ` AND "nr_proposta"::text = $${count}`;
      params.push(nr_proposta.trim());
    } else {
      if (minLat && maxLat) {
        query += ` AND "Latitude" BETWEEN $${count} AND $${count+1} AND "Longitude" BETWEEN $${count+2} AND $${count+3}`;
        params.push(minLat, maxLat, minLng, maxLng);
        count += 4;
      }
      // FILTRO POR SIGLA_UF 
      if (uf && uf !== 'Todos') { query += ` AND "sigla_uf" = $${count}`; params.push(uf); count++; }
      if (municipio && municipio !== 'Todos') { query += ` AND "cod_municipio" = $${count}`; params.push(municipio); count++; }
    }
    const resultado = await pool.query(query + ` LIMIT 1500`, params);
    res.json(resultado.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/exportar-obra', async (req, res) => {
  try {
    const { nr_proposta } = req.query;
    
    if (!nr_proposta) return res.status(400).send('Número da proposta é obrigatório');

    const query = `SELECT * FROM instrumento.vw_detalhamento_obras WHERE "nr_proposta"::text = $1`;
    const resultado = await pool.query(query, [nr_proposta]);

    if (resultado.rows.length === 0) return res.status(404).send('Obra não encontrada');

    const dados = resultado.rows[0];
    const colunas = Object.keys(dados);
    const cabecalho = colunas.join(';');
    const valores = colunas.map(col => `"${dados[col] || ''}"`).join(';');
    
    const csvContent = '\ufeff' + cabecalho + '\n' + valores;

    const nomeArquivo = `nr_proposta_${nr_proposta.replace(/\//g, '_')}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Backend Ativo'));