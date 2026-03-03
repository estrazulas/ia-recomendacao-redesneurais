import { query } from './src/config/db.js';

async function init() {
  try {
    console.log('⏳ Iniciando configuração do banco...');
    
    // 1. Habilita a extensão de vetores
    await query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ Extensão "vector" pronta.');

    // 2. Cria a tabela de PRODUTOS
    // O vector(14) deve bater com o tamanho do seu encodeProduct
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        category TEXT,
        price DECIMAL,
        color TEXT,
        embedding vector(14) 
      )
    `);
    console.log('✅ Tabela "products" criada com sucesso.');

    // 3. Criação da Tabela de VETORES DE USUÁRIOS
    await query(`
      CREATE TABLE IF NOT EXISTS users_vectors (
        user_id INTEGER PRIMARY KEY,
        name TEXT,
        embedding vector(14)
      )
    `);
    console.log('✅ Tabela "users_vectors" pronta.');

    // 4. Tabela de CONFIGURAÇÕES DO MODELO (Contexto de Normalização)
    // Usamos JSONB para guardar o "dicionário" de preços, cores e categorias
    await query(`
      CREATE TABLE IF NOT EXISTS model_configs (
        key TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "model_configs" para contexto JSON pronta.');

    // 5. Criação de Índices (Melhora a performance da busca vetorial)
    await query(`
        CREATE INDEX IF NOT EXISTS products_embedding_idx ON products 
        USING hnsw (embedding vector_cosine_ops);
    `);
    console.log('✅ Índices de busca vetorial criados.');

    // Inserção opcional do registro inicial do contexto para evitar erros de select vazio
    await query(`
      INSERT INTO model_configs (key, data) 
      VALUES ('global_normalization_context', '{}')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('🚀 Configuração finalizada com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao configurar banco:', err);
    process.exit(1);
  }
}

init();