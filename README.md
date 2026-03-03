# E-commerce Recommendation System (IA Híbrida)

Sistema de recomendação **full-stack** que combina a velocidade da
**Busca Vetorial** com a precisão de **Redes Neurais Deep Learning**
utilizando **TensorFlow.js**.

------------------------------------------------------------------------

## 🚀 Arquitetura de Recomendação Híbrida

O projeto utiliza uma estratégia de **duas etapas** para fornecer
recomendações em tempo real:

### 1️⃣ Busca Vetorial (pgvector)

Realiza uma **pré-seleção dos 100 produtos mais similares** ao perfil do
usuário diretamente no banco de dados **PostgreSQL** utilizando vetores
de embedding.

### 2️⃣ Refinamento Neural (TensorFlow.js)

Um **Web Worker** processa esses 100 candidatos através de uma **rede
neural densa**, calculando o **Neural Score final** e retornando o **Top
10 produtos mais relevantes**.

------------------------------------------------------------------------

## 🛠️ Tecnologias

-   **IA / Machine Learning**
    -   TensorFlow.js (Deep Learning no Navegador)
-   **Backend**
    -   Node.js
    -   Express
-   **Banco de Dados**
    -   PostgreSQL
    -   pgvector
-   **Infraestrutura**
    -   Docker

------------------------------------------------------------------------

## ⚙️ Setup e Instalação

### 1️⃣ Banco de Dados (Docker)

Este projeto depende da extensão **pgvector**. A forma mais rápida de
subir o ambiente é via Docker:

``` bash
# Descarrega e sobe o container do PostgreSQL 16 com pgvector
docker run --name pgvector-db \
  -e POSTGRES_PASSWORD=SUA_SENHA \
  -p 5432:5432 \
  -d pgvector/pgvector:pg16
```

------------------------------------------------------------------------

### 2️⃣ Configuração do Banco de Dados

Acede ao banco via **DBeaver**, **pgAdmin** ou terminal e executa:

``` sql
-- Habilita a extensão de vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para persistência do modelo e configurações
CREATE TABLE model_configs (
    key VARCHAR(255) PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

------------------------------------------------------------------------

### 3️⃣ Backend e Configuração

No ficheiro de configuração do banco (ex: `src/config/db.js`), insere as
credenciais do Docker.

Instala as dependências:

``` bash
npm install
```

Inicia o servidor:

``` bash
npm start
```

------------------------------------------------------------------------

### 4️⃣ Acesso ao Frontend

O servidor normalmente estará disponível em:

    http://localhost:3001

*(ou na porta definida no `server.js`)*

------------------------------------------------------------------------

## 🧠 Ciclo de Vida da IA

### 🔄 Sincronização

Envia os dados dos ficheiros JSON para o banco através das rotas
`/sync`, populando o PostgreSQL com embeddings e metadados.

### 🎓 Treinamento

Ao clicar em **"Treinar"** no dashboard: - O Web Worker treina a rede
neural - Os pesos são serializados em **Base64** - O modelo é salvo
diretamente no PostgreSQL

### 💾 Persistência Inteligente

-   O modelo é carregado do banco diretamente para a **memória do
    navegador**
-   Não há necessidade de ficheiros físicos `.json` ou `.bin` no
    servidor
-   Atualizações de página não exigem novo treinamento

------------------------------------------------------------------------

## ✅ Benefícios da Arquitetura

-   ⚡ Alta performance em tempo real
-   🧩 Arquitetura híbrida escalável
-   🧠 IA totalmente persistente no banco
-   🌐 Deep Learning rodando no browser
-   🔥 Zero dependência de storage de modelos no servidor

------------------------------------------------------------------------

## 📌 Status do Projeto

🚧 Em desenvolvimento / experimental\
Ideal para estudos avançados de **Sistemas de Recomendação**, **Busca
Vetorial** e **IA no Frontend**.