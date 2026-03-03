# E-commerce Recommendation System (IA Híbrida)

Sistema de recomendação **full-stack** que combina a velocidade da
**Busca Vetorial** com a precisão de **Redes Neurais Deep Learning**
utilizando **TensorFlow.js**.

------------------------------------------------------------------------

## 🚀 Arquitetura de Recomendação Híbrida

O projeto utiliza uma estratégia de **duas etapas** para fornecer
recomendações em tempo real:

### 1️⃣ Busca Vetorial (pgvector)

Filtragem Inteligente (Database-side): Em vez de processar milhares de produtos na memória do navegador, o sistema utiliza o ***pgvector*** no PostgreSQL. Através de busca por similaridade de cosseno em vetores de características, o banco de dados filtra instantaneamente os ***100 produtos mais alinhados ao perfil do usuário***.

### 2️⃣ Refinamento Neural (TensorFlow.js)

Predição Neural (Client-side): Os 100 candidatos selecionados pelo banco são enviados para um ***Web Worker***. A Rede Neural (MLP) então realiza a predição final apenas sobre esse subconjunto, calculando um Neural Score de alta precisão. Isso reduz drasticamente o consumo de RAM e CPU do cliente, permitindo escalar para milhões de produtos.

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

Rodar node setup-db.js

------------------------------------------------------------------------

### 3️⃣ Iniciando

No ficheiro de configuração do banco (ex: `src/config/db.js`), insere as
credenciais do Docker.

Instala as dependências:

``` bash
npm install
```

Inicia a aplicacao:

``` bash
npm start
```

------------------------------------------------------------------------

### 4️⃣ Iniciando o Backend

O servidor normalmente estará disponível em:

    http://localhost:3001

``` bash
node server.js
```

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
-   Atualizações de página não exigem novo treinamento toda vez que abre, reutiliza o modelo que foi armazenado em banco

------------------------------------------------------------------------

## ✅ Benefícios da Arquitetura

-   ⚡ Alta performance em tempo real
-   🧩 Arquitetura híbrida escalável
-   🧠 IA totalmente persistente no banco
-   🌐 Deep Learning rodando no browser


------------------------------------------------------------------------

## 📌 Status do Projeto

🚧 Em desenvolvimento / experimental\
Ideal para estudos avançados de **Sistemas de Recomendação**, **Busca
Vetorial** e **IA no Frontend**.