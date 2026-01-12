import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import { Parser } from 'json2csv';
import cors from 'cors';

const app = express();
app.use(cors());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

app.get('/api/exportar-dados', async (req, res) => {
  try {
    // Recebe todos os filtros da imagem
    const { 
      uf, municipio, situacao_obra, nr_instrumento, 
      nr_proposta, novo_pac, tipo_instrumento, 
      componente, carteira_ativa, termino_vigencia, prazo_clausula 
    } = req.query;

    let queryText = 'SELECT * FROM instrumento.vw_carteira_dsr WHERE 1=1';
    let parametros = [];
    let contador = 1;

    const adicionarFiltro = (campo, valor) => {
      if (valor && valor !== 'Todos') {
        queryText += ` AND ${campo} = $${contador}`;
        parametros.push(valor);
        contador++;
      }
    };

    // Mapeamento dos filtros para as colunas do banco
    adicionarFiltro('sigla_uf', uf);
    adicionarFiltro('nome_municipio', municipio);
    adicionarFiltro('situacao_obra', situacao_obra);
    adicionarFiltro('nr_instrumento', nr_instrumento);
    adicionarFiltro('nr_proposta', nr_proposta );
    adicionarFiltro('novo_pac', novo_pac);
    adicionarFiltro('tipo_instrumento', tipo_instrumento);
    adicionarFiltro('componente', componente);
    adicionarFiltro('carteira_ativa', carteira_ativa);
    adicionarFiltro('termino_vigencia', termino_vigencia);
    adicionarFiltro('prazo_clausula', prazo_clausula);

    const resultado = await pool.query(queryText, parametros);
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(resultado.rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('Relatorio_Filtrado_MCID.csv');
    return res.send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar dados no banco');
  }
});

app.listen(3000, () => {
  console.log('Servidor Backend rodando na porta 3000 🚀');
});